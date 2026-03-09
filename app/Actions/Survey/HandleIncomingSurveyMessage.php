<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use App\Models\Contact;
use App\Models\Question;
use App\Models\Survey;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class HandleIncomingSurveyMessage
{
    public function __construct(
        private readonly SendSmsMessage $sendSmsMessage,
    ) {}

    /**
     * @return array{processed: bool, status: string, message: string}
     */
    public function handle(string $phoneNumber, string $incomingMessage): array
    {
        $normalizedPhoneNumber = $this->normalizePhoneNumber($phoneNumber);
        $normalizedMessage = mb_strtolower(trim($incomingMessage));

        if ($normalizedPhoneNumber === '' || $normalizedMessage === '') {
            return [
                'processed' => false,
                'status' => 'invalid_payload',
                'message' => 'Phone number or message is missing.',
            ];
        }

        $contact = $this->findContactByPhone($normalizedPhoneNumber);
        if (! $contact instanceof Contact) {
            return [
                'processed' => false,
                'status' => 'contact_not_found',
                'message' => 'No matching contact found for this phone number.',
            ];
        }

        $surveyWithActiveSession = $this->findSurveyWithActiveSession($contact);
        if ($surveyWithActiveSession instanceof Survey) {
            $triggerWord = mb_strtolower(trim((string) $surveyWithActiveSession->trigger_word));
            if ($this->messageMatchesTriggerWord($normalizedMessage, $triggerWord)) {
                return $this->startSurveySession($contact, $surveyWithActiveSession);
            }

            return $this->continueSurveySession($contact, $surveyWithActiveSession, $normalizedMessage);
        }

        $survey = $this->findSurveyByTriggerWord($contact, $normalizedMessage);
        if (! $survey instanceof Survey) {
            return [
                'processed' => false,
                'status' => 'no_matching_survey',
                'message' => 'No active survey matched the incoming trigger word.',
            ];
        }

        return $this->startSurveySession($contact, $survey);
    }

    /**
     * @return array{processed: bool, status: string, message: string}
     */
    private function startSurveySession(Contact $contact, Survey $survey): array
    {
        $parentQuestions = $this->parentQuestions($survey);
        $firstQuestion = $parentQuestions->get(0);

        if (! $firstQuestion instanceof Question) {
            return [
                'processed' => false,
                'status' => 'no_questions',
                'message' => 'The survey has no questions to send.',
            ];
        }

        $sendResult = $this->sendSurveyMessage(
            survey: $survey,
            contact: $contact,
            message: $this->buildParentQuestionMessage($survey, $firstQuestion, 0),
            failureMessage: 'Failed to dispatch first survey question from inbound trigger.',
        );

        if (! $sendResult['successful']) {
            return [
                'processed' => false,
                'status' => 'dispatch_failed',
                'message' => $sendResult['status_message'],
            ];
        }

        $this->persistSessionState($survey, $contact, [
            'started' => true,
            'active_node' => [
                'kind' => 'parent',
                'question_index' => 0,
            ],
        ]);

        return [
            'processed' => true,
            'status' => 'question_dispatched',
            'message' => 'First question dispatched successfully.',
        ];
    }

    /**
     * @return array{processed: bool, status: string, message: string}
     */
    private function continueSurveySession(Contact $contact, Survey $survey, string $normalizedMessage): array
    {
        $sessionState = $this->decodeSessionState($survey);
        if ($sessionState === null) {
            return [
                'processed' => false,
                'status' => 'invalid_session',
                'message' => 'Survey session state could not be parsed.',
            ];
        }

        $activeNode = $sessionState['active_node'] ?? null;
        if (! is_array($activeNode) || ! isset($activeNode['kind'])) {
            return [
                'processed' => false,
                'status' => 'invalid_session',
                'message' => 'Survey session has no active question.',
            ];
        }

        $parentQuestions = $this->parentQuestions($survey);
        if ($parentQuestions->isEmpty()) {
            return [
                'processed' => false,
                'status' => 'no_questions',
                'message' => 'The survey has no questions to continue.',
            ];
        }

        $nodeKind = (string) $activeNode['kind'];

        if ($nodeKind === 'parent') {
            return $this->continueFromParentNode(
                contact: $contact,
                survey: $survey,
                parentQuestions: $parentQuestions,
                activeNode: $activeNode,
                normalizedMessage: $normalizedMessage,
            );
        }

        if ($nodeKind === 'child') {
            return $this->continueFromChildNode(
                contact: $contact,
                survey: $survey,
                parentQuestions: $parentQuestions,
                activeNode: $activeNode,
                normalizedMessage: $normalizedMessage,
            );
        }

        return [
            'processed' => false,
            'status' => 'invalid_session',
            'message' => 'Survey session node type is not supported.',
        ];
    }

    /**
     * @param  array<string, mixed>  $activeNode
     * @return array{processed: bool, status: string, message: string}
     */
    private function continueFromParentNode(
        Contact $contact,
        Survey $survey,
        Collection $parentQuestions,
        array $activeNode,
        string $normalizedMessage,
    ): array {
        $currentQuestionIndex = (int) ($activeNode['question_index'] ?? -1);
        $question = $parentQuestions->get($currentQuestionIndex);

        if (! $question instanceof Question) {
            return $this->completeSurveySession($contact, $survey);
        }

        $selectedOptionIndex = null;

        if ($question->response_type === 'multiple-choice') {
            $options = $this->questionOptionTexts($question);
            if ($options !== []) {
                $selectedOptionIndex = $this->parseMultipleChoiceReply($normalizedMessage, $options);

                if ($selectedOptionIndex === null) {
                    $sendResult = $this->sendSurveyMessage(
                        survey: $survey,
                        contact: $contact,
                        message: sprintf(
                            'Please reply with option number (1-%d) or exact option text.',
                            count($options)
                        ),
                        failureMessage: 'Failed to dispatch multiple-choice validation prompt.',
                    );

                    if (! $sendResult['successful']) {
                        return [
                            'processed' => false,
                            'status' => 'dispatch_failed',
                            'message' => $sendResult['status_message'],
                        ];
                    }

                    return [
                        'processed' => true,
                        'status' => 'awaiting_valid_reply',
                        'message' => 'Waiting for a valid multiple-choice option.',
                    ];
                }
            }
        }

        if ($question->response_type === 'multiple-choice' && ! $question->allow_multiple && $selectedOptionIndex !== null) {
            $option = $this->questionOptions($question)->get($selectedOptionIndex);
            $optionBranching = is_array($option?->branching) ? $option->branching : null;
            $childQuestions = $this->extractChildQuestions($optionBranching);

            if ($childQuestions !== []) {
                $firstChildQuestion = $childQuestions[0] ?? null;

                if ($firstChildQuestion !== null) {
                    $followUpBranching = $this->resolveFollowUpBranchingTarget($optionBranching, $question, $selectedOptionIndex);
                    $sendResult = $this->sendSurveyMessage(
                        survey: $survey,
                        contact: $contact,
                        message: $this->buildChildQuestionMessage($survey, $firstChildQuestion, $currentQuestionIndex, 0),
                        failureMessage: 'Failed to dispatch child survey question.',
                    );

                    if (! $sendResult['successful']) {
                        return [
                            'processed' => false,
                            'status' => 'dispatch_failed',
                            'message' => $sendResult['status_message'],
                        ];
                    }

                    $this->persistSessionState($survey, $contact, [
                        'started' => true,
                        'active_node' => [
                            'kind' => 'child',
                            'parent_question_index' => $currentQuestionIndex,
                            'option_index' => $selectedOptionIndex,
                            'child_question_index' => 0,
                            'follow_up_branching' => $followUpBranching,
                        ],
                    ]);

                    return [
                        'processed' => true,
                        'status' => 'question_dispatched',
                        'message' => 'Child survey question dispatched successfully.',
                    ];
                }
            }
        }

        $nextQuestionIndex = $this->resolveNextParentQuestionIndex(
            question: $question,
            currentQuestionIndex: $currentQuestionIndex,
            totalQuestions: $parentQuestions->count(),
            selectedOptionIndex: $selectedOptionIndex,
        );

        return $this->moveToParentQuestion(
            contact: $contact,
            survey: $survey,
            parentQuestions: $parentQuestions,
            nextQuestionIndex: $nextQuestionIndex,
        );
    }

    /**
     * @param  array<string, mixed>  $activeNode
     * @return array{processed: bool, status: string, message: string}
     */
    private function continueFromChildNode(
        Contact $contact,
        Survey $survey,
        Collection $parentQuestions,
        array $activeNode,
        string $normalizedMessage,
    ): array {
        $parentQuestionIndex = (int) ($activeNode['parent_question_index'] ?? -1);
        $optionIndex = (int) ($activeNode['option_index'] ?? -1);
        $childQuestionIndex = (int) ($activeNode['child_question_index'] ?? -1);
        $followUpBranching = $activeNode['follow_up_branching'] ?? null;

        $parentQuestion = $parentQuestions->get($parentQuestionIndex);
        if (! $parentQuestion instanceof Question) {
            return $this->completeSurveySession($contact, $survey);
        }

        $selectedOption = $this->questionOptions($parentQuestion)->get($optionIndex);
        $optionBranching = is_array($selectedOption?->branching) ? $selectedOption->branching : null;
        $childQuestions = $this->extractChildQuestions($optionBranching);
        $activeChildQuestion = $childQuestions[$childQuestionIndex] ?? null;

        if ($activeChildQuestion === null) {
            $nextQuestionIndex = $this->resolveNextParentQuestionIndexFromTarget(
                target: $followUpBranching,
                currentQuestionIndex: $parentQuestionIndex,
                totalQuestions: $parentQuestions->count(),
            );

            return $this->moveToParentQuestion(
                contact: $contact,
                survey: $survey,
                parentQuestions: $parentQuestions,
                nextQuestionIndex: $nextQuestionIndex,
            );
        }

        $selectedChildOptionIndex = null;
        if (($activeChildQuestion['response_type'] ?? 'free-text') === 'multiple-choice') {
            $childOptionTexts = $this->childOptionTexts($activeChildQuestion);

            if ($childOptionTexts !== []) {
                $selectedChildOptionIndex = $this->parseMultipleChoiceReply($normalizedMessage, $childOptionTexts);

                if ($selectedChildOptionIndex === null) {
                    $sendResult = $this->sendSurveyMessage(
                        survey: $survey,
                        contact: $contact,
                        message: sprintf(
                            'Please reply with option number (1-%d) or exact option text.',
                            count($childOptionTexts)
                        ),
                        failureMessage: 'Failed to dispatch child multiple-choice validation prompt.',
                    );

                    if (! $sendResult['successful']) {
                        return [
                            'processed' => false,
                            'status' => 'dispatch_failed',
                            'message' => $sendResult['status_message'],
                        ];
                    }

                    return [
                        'processed' => true,
                        'status' => 'awaiting_valid_reply',
                        'message' => 'Waiting for a valid child multiple-choice option.',
                    ];
                }
            }
        }

        $nextChildQuestionIndex = $this->resolveNextChildQuestionIndex(
            childQuestion: $activeChildQuestion,
            currentChildQuestionIndex: $childQuestionIndex,
            totalChildQuestions: count($childQuestions),
            selectedOptionIndex: $selectedChildOptionIndex,
        );

        if ($nextChildQuestionIndex === -1) {
            $nextQuestionIndex = $this->resolveNextParentQuestionIndexFromTarget(
                target: $followUpBranching,
                currentQuestionIndex: $parentQuestionIndex,
                totalQuestions: $parentQuestions->count(),
            );

            return $this->moveToParentQuestion(
                contact: $contact,
                survey: $survey,
                parentQuestions: $parentQuestions,
                nextQuestionIndex: $nextQuestionIndex,
            );
        }

        $nextChildQuestion = $childQuestions[$nextChildQuestionIndex] ?? null;

        if ($nextChildQuestion === null) {
            $nextQuestionIndex = $this->resolveNextParentQuestionIndexFromTarget(
                target: $followUpBranching,
                currentQuestionIndex: $parentQuestionIndex,
                totalQuestions: $parentQuestions->count(),
            );

            return $this->moveToParentQuestion(
                contact: $contact,
                survey: $survey,
                parentQuestions: $parentQuestions,
                nextQuestionIndex: $nextQuestionIndex,
            );
        }

        $sendResult = $this->sendSurveyMessage(
            survey: $survey,
            contact: $contact,
            message: $this->buildChildQuestionMessage($survey, $nextChildQuestion, $parentQuestionIndex, $nextChildQuestionIndex),
            failureMessage: 'Failed to dispatch child survey question.',
        );

        if (! $sendResult['successful']) {
            return [
                'processed' => false,
                'status' => 'dispatch_failed',
                'message' => $sendResult['status_message'],
            ];
        }

        $this->persistSessionState($survey, $contact, [
            'started' => true,
            'active_node' => [
                'kind' => 'child',
                'parent_question_index' => $parentQuestionIndex,
                'option_index' => $optionIndex,
                'child_question_index' => $nextChildQuestionIndex,
                'follow_up_branching' => $followUpBranching,
            ],
        ]);

        return [
            'processed' => true,
            'status' => 'question_dispatched',
            'message' => 'Child survey question dispatched successfully.',
        ];
    }

    /**
     * @return array{processed: bool, status: string, message: string}
     */
    private function moveToParentQuestion(
        Contact $contact,
        Survey $survey,
        Collection $parentQuestions,
        int $nextQuestionIndex,
    ): array {
        if ($nextQuestionIndex === -1) {
            return $this->completeSurveySession($contact, $survey);
        }

        $nextQuestion = $parentQuestions->get($nextQuestionIndex);
        if (! $nextQuestion instanceof Question) {
            return $this->completeSurveySession($contact, $survey);
        }

        $sendResult = $this->sendSurveyMessage(
            survey: $survey,
            contact: $contact,
            message: $this->buildParentQuestionMessage($survey, $nextQuestion, $nextQuestionIndex),
            failureMessage: 'Failed to dispatch next survey question.',
        );

        if (! $sendResult['successful']) {
            return [
                'processed' => false,
                'status' => 'dispatch_failed',
                'message' => $sendResult['status_message'],
            ];
        }

        $this->persistSessionState($survey, $contact, [
            'started' => true,
            'active_node' => [
                'kind' => 'parent',
                'question_index' => $nextQuestionIndex,
            ],
        ]);

        return [
            'processed' => true,
            'status' => 'question_dispatched',
            'message' => 'Next survey question dispatched successfully.',
        ];
    }

    /**
     * @return array{processed: bool, status: string, message: string}
     */
    private function completeSurveySession(Contact $contact, Survey $survey): array
    {
        $completionMessage = trim((string) $survey->completion_message);
        if ($completionMessage === '') {
            $completionMessage = 'Thank you for participating in this survey.';
        }

        $sendResult = $this->sendSurveyMessage(
            survey: $survey,
            contact: $contact,
            message: $completionMessage,
            failureMessage: 'Failed to dispatch survey completion message.',
        );

        if (! $sendResult['successful']) {
            return [
                'processed' => false,
                'status' => 'dispatch_failed',
                'message' => $sendResult['status_message'],
            ];
        }

        $this->markSessionCompleted($survey, $contact);

        return [
            'processed' => true,
            'status' => 'survey_completed',
            'message' => 'Survey completed successfully.',
        ];
    }

    private function findContactByPhone(string $normalizedPhoneNumber): ?Contact
    {
        $lastNineDigits = mb_substr($normalizedPhoneNumber, -9);

        $candidates = Contact::query()
            ->whereNotNull('phone')
            ->when($lastNineDigits !== '', function ($query) use ($lastNineDigits): void {
                $query->where('phone', 'like', "%{$lastNineDigits}%");
            })
            ->get();

        /** @var ?Contact $contact */
        $contact = $candidates->first(function (Contact $contact) use ($normalizedPhoneNumber, $lastNineDigits): bool {
            $normalizedContactPhone = $this->normalizePhoneNumber((string) $contact->phone);

            if ($normalizedContactPhone === $normalizedPhoneNumber) {
                return true;
            }

            return $lastNineDigits !== '' && mb_substr($normalizedContactPhone, -9) === $lastNineDigits;
        });

        return $contact;
    }

    private function findSurveyWithActiveSession(Contact $contact): ?Survey
    {
        $today = now()->toDateString();

        return $contact->surveys()
            ->where('status', 'active')
            ->whereNotNull('contact_survey.sent_at')
            ->whereNotNull('contact_survey.sms_flow_state')
            ->whereNull('contact_survey.sms_flow_completed_at')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->orderByPivot('updated_at', 'desc')
            ->first();
    }

    private function findSurveyByTriggerWord(Contact $contact, string $normalizedMessage): ?Survey
    {
        $today = now()->toDateString();

        $surveys = $contact->surveys()
            ->where('status', 'active')
            ->whereNotNull('contact_survey.sent_at')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->orderByDesc('scheduled_time')
            ->get();

        /** @var ?Survey $survey */
        $survey = $surveys->first(function (Survey $survey) use ($normalizedMessage): bool {
            $triggerWord = mb_strtolower(trim((string) $survey->trigger_word));

            return $this->messageMatchesTriggerWord($normalizedMessage, $triggerWord);
        });

        return $survey;
    }

    private function normalizePhoneNumber(string $phoneNumber): string
    {
        $digitsOnly = preg_replace('/\D+/', '', $phoneNumber);
        if (! is_string($digitsOnly) || $digitsOnly === '') {
            return '';
        }

        if (strlen($digitsOnly) === 10 && str_starts_with($digitsOnly, '0')) {
            return '254'.substr($digitsOnly, 1);
        }

        if (strlen($digitsOnly) === 9) {
            return '254'.$digitsOnly;
        }

        return $digitsOnly;
    }

    private function messageMatchesTriggerWord(string $normalizedMessage, string $normalizedTriggerWord): bool
    {
        if ($normalizedTriggerWord === '') {
            return false;
        }

        if ($normalizedMessage === $normalizedTriggerWord) {
            return true;
        }

        $messageSegments = preg_split('/\s+/', $normalizedMessage);
        if (! is_array($messageSegments)) {
            return false;
        }

        foreach ($messageSegments as $segment) {
            $normalizedSegment = trim($segment, " \t\n\r\0\x0B.,!?;:\"'`~@#$%^&*()-_=+[]{}<>/\\|");

            if ($normalizedSegment === $normalizedTriggerWord) {
                return true;
            }
        }

        return false;
    }

    private function buildParentQuestionMessage(Survey $survey, Question $question, int $questionIndex): string
    {
        $lines = [
            "Survey: {$survey->name}",
            sprintf('Q%d: %s', $questionIndex + 1, trim((string) $question->question)),
        ];

        if ($question->response_type === 'multiple-choice') {
            $options = $this->questionOptionTexts($question);

            if ($options !== []) {
                $lines[] = 'Reply with option number or exact option text.';

                foreach ($options as $index => $optionText) {
                    $lines[] = sprintf('%d. %s', $index + 1, $optionText);
                }
            }
        } else {
            $lines[] = 'Reply with your answer.';
        }

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $childQuestion
     */
    private function buildChildQuestionMessage(Survey $survey, array $childQuestion, int $parentQuestionIndex, int $childQuestionIndex): string
    {
        $lines = [
            "Survey: {$survey->name}",
            sprintf(
                'Q%d.%d: %s',
                $parentQuestionIndex + 1,
                $childQuestionIndex + 1,
                trim((string) ($childQuestion['question'] ?? ''))
            ),
        ];

        if (($childQuestion['response_type'] ?? 'free-text') === 'multiple-choice') {
            $options = $this->childOptionTexts($childQuestion);

            if ($options !== []) {
                $lines[] = 'Reply with option number or exact option text.';

                foreach ($options as $index => $optionText) {
                    $lines[] = sprintf('%d. %s', $index + 1, $optionText);
                }
            }
        } else {
            $lines[] = 'Reply with your answer.';
        }

        return implode("\n", $lines);
    }

    private function parseMultipleChoiceReply(string $reply, array $options): ?int
    {
        $normalizedReply = mb_strtolower(trim($reply));
        if ($normalizedReply === '') {
            return null;
        }

        $numericReply = (int) $normalizedReply;
        if (
            ctype_digit($normalizedReply) &&
            $numericReply >= 1 &&
            $numericReply <= count($options)
        ) {
            return $numericReply - 1;
        }

        foreach ($options as $index => $option) {
            if (mb_strtolower(trim((string) $option)) === $normalizedReply) {
                return $index;
            }
        }

        return null;
    }

    private function parentQuestions(Survey $survey): Collection
    {
        return $survey->questions()
            ->with('options')
            ->orderBy('order')
            ->get();
    }

    private function questionOptions(Question $question): Collection
    {
        return $question->options
            ->sortBy('order')
            ->filter(fn ($option): bool => trim((string) $option->option) !== '')
            ->values();
    }

    /**
     * @return array<int, string>
     */
    private function questionOptionTexts(Question $question): array
    {
        return $this->questionOptions($question)
            ->map(fn ($option): string => trim((string) $option->option))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>|null  $optionBranching
     * @return array<int, array<string, mixed>>
     */
    private function extractChildQuestions(?array $optionBranching): array
    {
        if ($optionBranching === null) {
            return [];
        }

        $childQuestions = $optionBranching['child_questions'] ?? null;
        if (! is_array($childQuestions)) {
            return [];
        }

        $normalizedChildQuestions = [];

        foreach ($childQuestions as $childQuestion) {
            if (! is_array($childQuestion)) {
                continue;
            }

            $questionText = trim((string) ($childQuestion['question'] ?? ''));
            if ($questionText === '') {
                continue;
            }

            $normalizedChildQuestions[] = [
                'question' => $questionText,
                'response_type' => (string) ($childQuestion['response_type'] ?? 'free-text'),
                'allow_multiple' => (bool) ($childQuestion['allow_multiple'] ?? false),
                'after_answer_go_to' => $childQuestion['after_answer_go_to'] ?? null,
                'options' => is_array($childQuestion['options'] ?? null) ? $childQuestion['options'] : [],
                'order' => (int) ($childQuestion['order'] ?? count($normalizedChildQuestions)),
            ];
        }

        usort($normalizedChildQuestions, fn (array $left, array $right): int => ((int) ($left['order'] ?? 0)) <=> ((int) ($right['order'] ?? 0)));

        return array_values($normalizedChildQuestions);
    }

    /**
     * @param  array<string, mixed>  $childQuestion
     * @return array<int, array{option: string, go_to: mixed}>
     */
    private function childOptions(array $childQuestion): array
    {
        $options = $childQuestion['options'] ?? [];
        if (! is_array($options)) {
            return [];
        }

        $normalizedOptions = [];

        foreach ($options as $option) {
            if (! is_array($option)) {
                continue;
            }

            $optionText = trim((string) ($option['option'] ?? ''));
            if ($optionText === '') {
                continue;
            }

            $normalizedOptions[] = [
                'option' => $optionText,
                'go_to' => $option['go_to'] ?? null,
            ];
        }

        return $normalizedOptions;
    }

    /**
     * @param  array<string, mixed>  $childQuestion
     * @return array<int, string>
     */
    private function childOptionTexts(array $childQuestion): array
    {
        return array_map(
            fn (array $option): string => $option['option'],
            $this->childOptions($childQuestion),
        );
    }

    private function resolveNextParentQuestionIndex(
        Question $question,
        int $currentQuestionIndex,
        int $totalQuestions,
        ?int $selectedOptionIndex,
    ): int {
        $configuredTarget = null;

        if (
            $question->response_type === 'multiple-choice' &&
            ! $question->allow_multiple &&
            $selectedOptionIndex !== null &&
            is_array($question->branching) &&
            array_is_list($question->branching)
        ) {
            $configuredTarget = $question->branching[$selectedOptionIndex] ?? null;
        } else {
            $configuredTarget = $this->extractBranchingTarget($question->branching);
        }

        return $this->resolveNextParentQuestionIndexFromTarget(
            target: $configuredTarget,
            currentQuestionIndex: $currentQuestionIndex,
            totalQuestions: $totalQuestions,
        );
    }

    private function resolveNextParentQuestionIndexFromTarget(mixed $target, int $currentQuestionIndex, int $totalQuestions): int
    {
        $nextQuestionIndex = $currentQuestionIndex + 1;

        if ($target !== null && $target !== '' && is_numeric((string) $target)) {
            $parsedTarget = (int) $target;

            if ($parsedTarget < 0) {
                return -1;
            }

            if ($parsedTarget > 0) {
                $nextQuestionIndex = $parsedTarget;
            }
        }

        if ($nextQuestionIndex < 0 || $nextQuestionIndex >= $totalQuestions) {
            return -1;
        }

        return $nextQuestionIndex;
    }

    /**
     * @param  array<string, mixed>  $childQuestion
     */
    private function resolveNextChildQuestionIndex(
        array $childQuestion,
        int $currentChildQuestionIndex,
        int $totalChildQuestions,
        ?int $selectedOptionIndex,
    ): int {
        $target = $childQuestion['after_answer_go_to'] ?? null;

        if (
            ($childQuestion['response_type'] ?? 'free-text') === 'multiple-choice' &&
            ! ((bool) ($childQuestion['allow_multiple'] ?? false)) &&
            $selectedOptionIndex !== null
        ) {
            $childOptions = $this->childOptions($childQuestion);
            $target = $childOptions[$selectedOptionIndex]['go_to'] ?? $target;
        }

        $nextChildQuestionIndex = $currentChildQuestionIndex + 1;

        if ($target !== null && $target !== '' && is_numeric((string) $target)) {
            $parsedTarget = (int) $target;

            if ($parsedTarget < 0) {
                return -1;
            }

            if ($parsedTarget > 0) {
                $nextChildQuestionIndex = $parsedTarget - 1;
            }
        }

        if ($nextChildQuestionIndex < 0 || $nextChildQuestionIndex >= $totalChildQuestions) {
            return -1;
        }

        return $nextChildQuestionIndex;
    }

    private function resolveFollowUpBranchingTarget(?array $optionBranching, Question $question, int $selectedOptionIndex): mixed
    {
        if ($optionBranching !== null) {
            $followUpTarget = $optionBranching['follow_up_after_children'] ?? null;
            if ($followUpTarget !== null && $followUpTarget !== '') {
                return $followUpTarget;
            }

            $nextQuestionTarget = $optionBranching['next_question'] ?? null;
            if ($nextQuestionTarget !== null && $nextQuestionTarget !== '') {
                return $nextQuestionTarget;
            }
        }

        if (
            is_array($question->branching) &&
            array_is_list($question->branching)
        ) {
            return $question->branching[$selectedOptionIndex] ?? null;
        }

        return $this->extractBranchingTarget($question->branching);
    }

    private function extractBranchingTarget(mixed $branching): mixed
    {
        if (! is_array($branching)) {
            return $branching;
        }

        if (array_key_exists('next_question', $branching)) {
            return $branching['next_question'];
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeSessionState(Survey $survey): ?array
    {
        $sessionState = $survey->pivot?->sms_flow_state;

        if (is_array($sessionState)) {
            return $sessionState;
        }

        if (! is_string($sessionState) || trim($sessionState) === '') {
            return null;
        }

        $decoded = json_decode($sessionState, true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function persistSessionState(Survey $survey, Contact $contact, array $state): void
    {
        $now = now();

        $survey->contacts()->updateExistingPivot($contact->id, [
            'sms_flow_state' => json_encode($state),
            'sms_flow_started_at' => $now,
            'sms_flow_completed_at' => null,
            'updated_at' => $now,
        ]);
    }

    private function markSessionCompleted(Survey $survey, Contact $contact): void
    {
        $now = now();

        $survey->contacts()->updateExistingPivot($contact->id, [
            'sms_flow_state' => null,
            'sms_flow_completed_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @return array{
     *     successful: bool,
     *     status: int|null,
     *     status_message: string,
     *     unique_id: string|null
     * }
     */
    private function sendSurveyMessage(Survey $survey, Contact $contact, string $message, string $failureMessage): array
    {
        $result = $this->sendSmsMessage->handle((string) $contact->phone, $message);

        if (! $result['successful']) {
            Log::warning($failureMessage, [
                'survey_id' => $survey->id,
                'contact_id' => $contact->id,
                'phone' => $contact->phone,
                'status' => $result['status'],
                'status_message' => $result['status_message'],
            ]);
        }

        return $result;
    }
}
