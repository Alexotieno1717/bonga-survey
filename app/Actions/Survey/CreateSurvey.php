<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use App\Models\Survey;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class CreateSurvey
{
    public function __construct(
        private readonly DispatchSurveyInvitations $dispatchSurveyInvitations,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, int $userId): Survey
    {
        $requestedStatus = (string) ($validated['status'] ?? 'draft');
        $startDate = CarbonImmutable::parse((string) $validated['startDate'])->startOfDay();
        $endDate = CarbonImmutable::parse((string) $validated['endDate'])->endOfDay();
        $scheduleTime = isset($validated['scheduleTime']) && $validated['scheduleTime'] !== ''
            ? CarbonImmutable::parse((string) $validated['scheduleTime'])
            : null;
        $now = now();

        $status = 'draft';
        if ($requestedStatus === 'active') {
            if ($now->between($startDate, $endDate, true)) {
                $status = 'active';
            } elseif ($now->greaterThan($endDate)) {
                $status = 'completed';
            }
        }

        /** @var Survey $survey */
        $survey = DB::transaction(function () use ($validated, $userId, $status, $requestedStatus, $scheduleTime): Survey {
            $survey = Survey::query()->create([
                'name' => $validated['surveyName'],
                'description' => $validated['description'],
                'start_date' => $validated['startDate'],
                'end_date' => $validated['endDate'],
                'trigger_word' => $validated['triggerWord'],
                'completion_message' => $validated['completionMessage'] ?? null,
                'invitation_message' => $validated['invitationMessage'],
                'scheduled_time' => $scheduleTime?->toDateTimeString(),
                'status' => $status,
                'created_with_ai' => (bool) ($validated['createdWithAi'] ?? false),
                'created_by' => $userId,
            ]);

            foreach ($validated['questions'] as $index => $questionData) {
                $question = $survey->questions()->create([
                    'question' => $questionData['question'],
                    'response_type' => $questionData['responseType'],
                    'free_text_description' => $questionData['freeTextDescription'] ?? null,
                    'allow_multiple' => $questionData['allowMultiple'] ?? false,
                    'order' => $index,
                    'branching' => $this->normalizeBranching($questionData['branching'] ?? null),
                ]);

                if ($questionData['responseType'] === 'multiple-choice' && ! empty($questionData['options'])) {
                    foreach ($questionData['options'] as $optionIndex => $optionText) {
                        if (! empty($optionText)) {
                            $optionBranching = null;
                            if (isset($questionData['branching'][$optionIndex]) && is_array($questionData['branching'])) {
                                $optionBranching = $questionData['branching'][$optionIndex];
                            }

                            /** @var array<string, mixed>|null $childQuestionState */
                            $childQuestionState = $questionData['childQuestionStates'][$optionIndex] ?? null;
                            $normalizedChildQuestions = $this->normalizeChildQuestions(
                                (array) ($childQuestionState['childQuestions'] ?? []),
                            );
                            $followUpBranching = $childQuestionState['followUpBranching'] ?? null;

                            $normalizedOptionBranching = $this->normalizeOptionBranching(
                                $optionBranching,
                                $followUpBranching,
                                $normalizedChildQuestions,
                            );

                            $question->options()->create([
                                'option' => $optionText,
                                'order' => $optionIndex,
                                'branching' => $normalizedOptionBranching,
                            ]);
                        }
                    }
                }
            }

            $contactIds = collect($validated['recipients'] ?? [])->pluck('id')->toArray();

            $pivotData = [];
            foreach ($contactIds as $contactId) {
                $pivotData[$contactId] = [
                    'sent_at' => $requestedStatus === 'active' ? $scheduleTime?->toDateTimeString() : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $survey->contacts()->attach($pivotData);

            return $survey;
        });

        if ($requestedStatus === 'active' && $scheduleTime instanceof CarbonImmutable && $scheduleTime->lessThanOrEqualTo($now)) {
            $this->dispatchSurveyInvitations->handle((int) $survey->id);
        }

        return $survey;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeBranching(mixed $branching): ?array
    {
        if ($branching === null) {
            return null;
        }

        if (is_array($branching)) {
            return $branching;
        }

        return ['next_question' => $branching];
    }

    /**
     * @param  array<int, mixed>  $childQuestions
     * @return array<int, array<string, mixed>>
     */
    private function normalizeChildQuestions(array $childQuestions): array
    {
        $normalized = [];

        foreach ($childQuestions as $childQuestionIndex => $childQuestionData) {
            if (! is_array($childQuestionData)) {
                continue;
            }

            $questionText = trim((string) ($childQuestionData['question'] ?? ''));
            $isSaved = (bool) ($childQuestionData['isSaved'] ?? false);
            if ($questionText === '') {
                continue;
            }
            if (! $isSaved) {
                continue;
            }

            $responseType = (string) ($childQuestionData['responseType'] ?? 'free-text');
            $options = [];

            if ($responseType === 'multiple-choice') {
                $childOptions = (array) ($childQuestionData['options'] ?? []);
                $childOptionBranching = (array) ($childQuestionData['optionBranching'] ?? []);

                foreach ($childOptions as $optionIndex => $optionText) {
                    $normalizedOptionText = trim((string) $optionText);

                    if ($normalizedOptionText === '') {
                        continue;
                    }

                    $options[] = [
                        'option' => $normalizedOptionText,
                        'order' => $optionIndex,
                        'go_to' => $this->normalizeBranchingTarget(
                            $childOptionBranching[$optionIndex] ?? null,
                        ),
                    ];
                }
            }

            $normalized[] = [
                'question' => $questionText,
                'response_type' => $responseType,
                'allow_multiple' => (bool) ($childQuestionData['allowMultiple'] ?? false),
                'free_text_description' => $childQuestionData['freeTextDescription'] ?? null,
                'order' => $childQuestionIndex,
                'after_answer_go_to' => $this->normalizeBranchingTarget(
                    $childQuestionData['branching'] ?? null,
                ),
                'options' => $options,
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<int, array<string, mixed>>  $normalizedChildQuestions
     * @return array<string, mixed>|null
     */
    private function normalizeOptionBranching(
        mixed $optionBranching,
        mixed $followUpBranching,
        array $normalizedChildQuestions,
    ): ?array {
        $nextQuestionTarget = $this->normalizeBranchingTarget($optionBranching);
        $followUpTarget = $this->normalizeBranchingTarget($followUpBranching);

        if ($nextQuestionTarget === null && $followUpTarget !== null) {
            $nextQuestionTarget = $followUpTarget;
        }

        if ($nextQuestionTarget === null && $normalizedChildQuestions === []) {
            return null;
        }

        return [
            'next_question' => $nextQuestionTarget,
            'child_questions' => $normalizedChildQuestions,
            'follow_up_after_children' => $followUpTarget,
        ];
    }

    private function normalizeBranchingTarget(mixed $target): int|string|null
    {
        if ($target === null || $target === '') {
            return null;
        }

        if (is_numeric($target)) {
            return (int) $target;
        }

        return is_string($target) ? $target : null;
    }
}
