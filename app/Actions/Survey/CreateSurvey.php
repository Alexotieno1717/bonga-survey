<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use App\Models\Survey;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class CreateSurvey
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, int $userId): Survey
    {
        $requestedStatus = (string) ($validated['status'] ?? 'draft');
        $startDate = CarbonImmutable::parse((string) $validated['startDate'])->startOfDay();
        $endDate = CarbonImmutable::parse((string) $validated['endDate'])->endOfDay();
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
        $survey = DB::transaction(function () use ($validated, $userId, $status, $requestedStatus): Survey {
            $survey = Survey::query()->create([
                'name' => $validated['surveyName'],
                'description' => $validated['description'],
                'start_date' => $validated['startDate'],
                'end_date' => $validated['endDate'],
                'trigger_word' => $validated['triggerWord'],
                'completion_message' => $validated['completionMessage'] ?? null,
                'invitation_message' => $validated['invitationMessage'],
                'scheduled_time' => $validated['scheduleTime'],
                'status' => $status,
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
                                $optionBranching = $this->normalizeBranching($questionData['branching'][$optionIndex]);
                            }

                            $question->options()->create([
                                'option' => $optionText,
                                'order' => $optionIndex,
                                'branching' => $optionBranching,
                            ]);
                        }
                    }
                }
            }

            $contactIds = collect($validated['recipients'] ?? [])->pluck('id')->toArray();

            $pivotData = [];
            foreach ($contactIds as $contactId) {
                $pivotData[$contactId] = [
                    'sent_at' => $requestedStatus === 'active' ? $validated['scheduleTime'] : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $survey->contacts()->attach($pivotData);

            return $survey;
        });

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
}
