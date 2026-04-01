<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

class GenerateAiSurveyDraft
{
    /**
     * @return array{
     *     survey_name: string,
     *     questions: array<int, array{
     *         question: string,
     *         response_type: 'free-text'|'multiple-choice',
     *         options: array<int, string>,
     *         allow_multiple: bool,
     *         branching: string|array<int, string>
     *     }>
     * }
     */
    public function handle(string $description, ?string $surveyName = null): array
    {
        $apiKey = (string) config('services.openai.api_key', '');
        if ($apiKey === '') {
            throw new RuntimeException('OpenAI API key is not configured.');
        }

        $baseUrl = rtrim((string) config('services.openai.base_url', 'https://api.openai.com/v1'), '/');
        $model = (string) config('services.openai.model', 'gpt-4o-mini');
        $timeout = (int) config('services.openai.timeout', 30);
        $organization = (string) config('services.openai.organization', '');
        $project = (string) config('services.openai.project', '');

        $client = Http::baseUrl($baseUrl)
            ->withToken($apiKey)
            ->when($organization !== '', fn ($httpClient) => $httpClient->withHeader('OpenAI-Organization', $organization))
            ->when($project !== '', fn ($httpClient) => $httpClient->withHeader('OpenAI-Project', $project))
            ->timeout($timeout);

        $draft = $this->requestDraft(
            client: $client,
            description: $description,
            surveyName: $surveyName,
            model: $model,
            forceMixed: false,
        );

        if (! $this->hasMixedQuestions($draft['questions'])) {
            $draft = $this->requestDraft(
                client: $client,
                description: $description,
                surveyName: $surveyName,
                model: $model,
                forceMixed: true,
            );
        }

        if (! $this->hasMixedQuestions($draft['questions'])) {
            $draft = $this->enforceMixedQuestions($draft);
        }

        return $draft;
    }

    private function buildSystemPrompt(?string $surveyName, bool $forceMixed): string
    {
        $nameInstruction = $surveyName !== null && trim($surveyName) !== ''
            ? 'Use the provided survey name verbatim.'
            : 'Generate a concise survey name.';

        $mixInstruction = $forceMixed
            ? 'Ensure a clear mix of multiple-choice and free-text questions.'
            : 'Include a mix of multiple-choice and free-text questions (at least 2 of each when total questions >= 4).';

        return implode(' ', [
            'You are a survey design assistant.',
            $nameInstruction,
            'Create clear, neutral survey questions based on the description.',
            'If the description mentions a number of questions, follow it; otherwise provide 8 questions.',
            $mixInstruction,
            'Use "multiple-choice" for choice questions with 2-5 options and "free-text" for open-ended questions.',
            'Decide the next question flow: use "0" for next question, "-1" for end survey, or a question index (0-based).',
            'For multiple-choice without allow_multiple, provide branching for each option (same length as options).',
            'For multiple-choice with allow_multiple, provide a single branching value for the question.',
            'Return only JSON.',
        ]);
    }

    private function buildUserPrompt(string $description, ?string $surveyName): string
    {
        $lines = [
            'Survey description:',
            $description,
        ];

        if ($surveyName !== null && trim($surveyName) !== '') {
            array_unshift($lines, sprintf('Survey name: %s', $surveyName));
        }

        return implode("\n", $lines);
    }

    private function buildPayload(
        string $description,
        ?string $surveyName,
        bool $includeResponseFormat,
        string $model,
        bool $forceMixed,
    ): array {
        $payload = [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $this->buildSystemPrompt($surveyName, $forceMixed),
                ],
                [
                    'role' => 'user',
                    'content' => $this->buildUserPrompt($description, $surveyName),
                ],
            ],
            'temperature' => 0.2,
        ];

        if ($includeResponseFormat) {
            $payload['response_format'] = $this->responseFormat();
        }

        return $payload;
    }

    /**
     * @return array{
     *     survey_name: string,
     *     questions: array<int, array{
     *         question: string,
     *         response_type: 'free-text'|'multiple-choice',
     *         options: array<int, string>,
     *         allow_multiple: bool,
     *         branching: string|array<int, string>
     *     }>
     * }
     */
    private function requestDraft(
        PendingRequest $client,
        string $description,
        ?string $surveyName,
        string $model,
        bool $forceMixed,
    ): array {
        $payload = $this->buildPayload(
            description: $description,
            surveyName: $surveyName,
            includeResponseFormat: true,
            model: $model,
            forceMixed: $forceMixed,
        );

        try {
            $response = $client->post('chat/completions', $payload);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('Could not connect to OpenAI.');
        }

        if (! $response->ok() && $this->shouldRetryWithoutResponseFormat($response)) {
            $payload = $this->buildPayload(
                description: $description,
                surveyName: $surveyName,
                includeResponseFormat: false,
                model: $model,
                forceMixed: $forceMixed,
            );

            try {
                $response = $client->post('chat/completions', $payload);
            } catch (ConnectionException $exception) {
                throw new RuntimeException('Could not connect to OpenAI.');
            }
        }

        if (! $response->ok()) {
            throw new RuntimeException($this->formatOpenAiError($response));
        }

        $content = $response->json('choices.0.message.content');
        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('OpenAI returned an empty response.');
        }

        try {
            $draft = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('OpenAI returned invalid JSON.');
        }

        if (! is_array($draft)) {
            throw new RuntimeException('OpenAI returned an unexpected response format.');
        }

        return $this->normalizeDraft($draft, $surveyName);
    }

    /**
     * @param  array<int, array{
     *     question: string,
     *     response_type: 'free-text'|'multiple-choice',
     *     options: array<int, string>,
     *     allow_multiple: bool,
     *     branching: string|array<int, string>
     * }>  $questions
     */
    private function hasMixedQuestions(array $questions): bool
    {
        $multipleChoiceCount = 0;
        $freeTextCount = 0;

        foreach ($questions as $question) {
            if ($question['response_type'] === 'multiple-choice') {
                $multipleChoiceCount++;
            } else {
                $freeTextCount++;
            }
        }

        return $multipleChoiceCount > 0 && $freeTextCount > 0;
    }

    /**
     * @param  array{
     *     survey_name: string,
     *     questions: array<int, array{
     *         question: string,
     *         response_type: 'free-text'|'multiple-choice',
     *         options: array<int, string>,
     *         allow_multiple: bool,
     *         branching: string|array<int, string>
     *     }>
     * }  $draft
     * @return array{
     *     survey_name: string,
     *     questions: array<int, array{
     *         question: string,
     *         response_type: 'free-text'|'multiple-choice',
     *         options: array<int, string>,
     *         allow_multiple: bool,
     *         branching: string|array<int, string>
     *     }>
     * }
     */
    private function enforceMixedQuestions(array $draft): array
    {
        $questions = $draft['questions'];
        $total = count($questions);
        if ($total === 0) {
            return $draft;
        }

        $multipleChoiceCount = 0;
        $freeTextCount = 0;
        foreach ($questions as $question) {
            if ($question['response_type'] === 'multiple-choice') {
                $multipleChoiceCount++;
            } else {
                $freeTextCount++;
            }
        }

        if ($multipleChoiceCount === 0) {
            $targetMultiple = $total >= 4 ? 2 : 1;
            $converted = 0;

            foreach ($questions as $index => $question) {
                if ($converted >= $targetMultiple) {
                    break;
                }

                if ($question['response_type'] !== 'free-text') {
                    continue;
                }

                $questions[$index] = [
                    ...$question,
                    'response_type' => 'multiple-choice',
                    'options' => [
                        'Strongly agree',
                        'Agree',
                        'Neutral',
                        'Disagree',
                        'Strongly disagree',
                    ],
                    'allow_multiple' => false,
                    'branching' => ['0', '0', '0', '0', '0'],
                ];
                $converted++;
            }
        } elseif ($freeTextCount === 0) {
            $targetFreeText = $total >= 4 ? 2 : 1;
            $converted = 0;

            foreach ($questions as $index => $question) {
                if ($converted >= $targetFreeText) {
                    break;
                }

                if ($question['response_type'] !== 'multiple-choice') {
                    continue;
                }

                $branching = $question['branching'];
                $normalizedBranching = is_array($branching) ? ($branching[0] ?? '0') : (string) ($branching ?? '0');

                $questions[$index] = [
                    ...$question,
                    'response_type' => 'free-text',
                    'options' => [],
                    'allow_multiple' => false,
                    'branching' => $normalizedBranching,
                ];
                $converted++;
            }
        }

        $draft['questions'] = $this->normalizeBranching($questions);

        return $draft;
    }

    /**
     * @return array{
     *     type: string
     * }
     */
    private function responseFormat(): array
    {
        return [
            'type' => 'json_object',
        ];
    }

    private function shouldRetryWithoutResponseFormat(Response $response): bool
    {
        $param = (string) $response->json('error.param', '');
        if ($param === 'response_format') {
            return true;
        }

        $message = (string) $response->json('error.message', '');
        if ($message !== '' && str_contains($message, 'response_format')) {
            return true;
        }

        return false;
    }

    private function formatOpenAiError(Response $response): string
    {
        $errorMessage = (string) $response->json('error.message', '');
        if ($errorMessage === '') {
            $body = trim($response->body());
            if ($body !== '') {
                $errorMessage = $body;
            }
        }

        $message = $errorMessage !== ''
            ? sprintf('OpenAI request failed: %s', $errorMessage)
            : sprintf('OpenAI request failed with status %d.', $response->status());

        $requestId = (string) $response->header('x-request-id');
        if ($requestId !== '') {
            $message .= sprintf(' Request ID: %s', $requestId);
        }

        return $message;
    }

    /**
     * @param  array<string, mixed>  $draft
     * @return array{
     *     survey_name: string,
     *     questions: array<int, array{
     *         question: string,
     *         response_type: 'free-text'|'multiple-choice',
     *         options: array<int, string>,
     *         allow_multiple: bool,
     *         branching: string|array<int, string>
     *     }>
     * }
     */
    private function normalizeDraft(array $draft, ?string $surveyName): array
    {
        $resolvedName = $this->normalizeText($draft['survey_name'] ?? '');
        if ($resolvedName === '') {
            $resolvedName = $this->normalizeText($surveyName ?? '') ?: 'Untitled Survey';
        }

        $questions = $draft['questions'] ?? [];
        if (! is_array($questions)) {
            $questions = [];
        }

        $normalizedQuestions = [];
        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }

            $text = $this->normalizeText($question['question'] ?? '');
            if ($text === '') {
                continue;
            }

            $responseType = $question['response_type'] ?? 'free-text';
            if (! in_array($responseType, ['free-text', 'multiple-choice'], true)) {
                $responseType = 'free-text';
            }

            $options = [];
            if ($responseType === 'multiple-choice' && is_array($question['options'] ?? null)) {
                foreach ($question['options'] as $option) {
                    $optionText = $this->normalizeText($option);
                    if ($optionText !== '') {
                        $options[] = $optionText;
                    }
                }
            }

            $normalizedQuestions[] = [
                'question' => $text,
                'response_type' => $responseType,
                'options' => $options,
                'allow_multiple' => $responseType === 'multiple-choice'
                    ? filter_var($question['allow_multiple'] ?? false, FILTER_VALIDATE_BOOL)
                    : false,
                'branching' => $question['branching'] ?? null,
            ];
        }

        if ($normalizedQuestions === []) {
            throw new RuntimeException('OpenAI did not return any valid questions.');
        }

        $normalizedQuestions = $this->normalizeBranching($normalizedQuestions);

        return [
            'survey_name' => $resolvedName,
            'questions' => $normalizedQuestions,
        ];
    }

    /**
     * @param  array<int, array{
     *     question: string,
     *     response_type: 'free-text'|'multiple-choice',
     *     options: array<int, string>,
     *     allow_multiple: bool,
     *     branching: mixed
     * }>  $questions
     * @return array<int, array{
     *     question: string,
     *     response_type: 'free-text'|'multiple-choice',
     *     options: array<int, string>,
     *     allow_multiple: bool,
     *     branching: string|array<int, string>
     * }>
     */
    private function normalizeBranching(array $questions): array
    {
        $questionCount = count($questions);

        foreach ($questions as $index => $question) {
            $defaultBranching = $index === $questionCount - 1 ? '-1' : '0';

            if ($question['response_type'] === 'multiple-choice') {
                if ($question['allow_multiple']) {
                    $branching = $question['branching'];
                    if (is_array($branching)) {
                        $first = $branching[0] ?? $defaultBranching;
                        $question['branching'] = is_scalar($first) ? (string) $first : $defaultBranching;
                    } elseif (is_scalar($branching)) {
                        $question['branching'] = (string) $branching;
                    } else {
                        $question['branching'] = $defaultBranching;
                    }
                } else {
                    $branching = $question['branching'];
                    $branchingValues = [];
                    foreach ($question['options'] as $optionIndex => $option) {
                        if (is_array($branching) && array_key_exists($optionIndex, $branching)) {
                            $value = $branching[$optionIndex];
                            $branchingValues[] = is_scalar($value) ? (string) $value : $defaultBranching;
                        } elseif (is_scalar($branching)) {
                            $branchingValues[] = (string) $branching;
                        } else {
                            $branchingValues[] = $defaultBranching;
                        }
                    }

                    $question['branching'] = $branchingValues;
                }
            } else {
                $branching = $question['branching'];
                if (is_scalar($branching)) {
                    $question['branching'] = (string) $branching;
                } else {
                    $question['branching'] = $defaultBranching;
                }
            }

            $questions[$index] = $question;
        }

        return $questions;
    }

    private function normalizeText(mixed $value): string
    {
        if (! is_string($value)) {
            $value = is_scalar($value) ? (string) $value : '';
        }

        return Str::squish($value);
    }
}
