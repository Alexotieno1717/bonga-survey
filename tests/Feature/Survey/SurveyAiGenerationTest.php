<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

test('ai survey page renders', function (): void {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->get(route('surveys.ai.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/ai/Index')
            ->where('input', null)
            ->where('draft', null)
        );
});

test('ai survey generation calls openai and returns a draft', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    config()->set('services.openai.api_key', 'test-key');
    config()->set('services.openai.base_url', 'https://api.openai.com/v1');
    config()->set('services.openai.model', 'gpt-4o-mini');

    $draft = [
        'survey_name' => 'Customer Pulse',
        'questions' => [
            [
                'question' => 'How satisfied are you with our support?',
                'response_type' => 'multiple-choice',
                'options' => ['Very satisfied', 'Somewhat satisfied', 'Not satisfied'],
            ],
            [
                'question' => 'What can we improve?',
                'response_type' => 'free-text',
                'options' => [],
            ],
        ],
    ];

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode($draft, JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('surveys.ai.generate'), [
            'survey_name' => 'Support Survey',
            'description' => 'Customer support feedback survey with 2 questions.',
        ]);

    $response->assertRedirect(route('surveys.ai.index'));

    $this
        ->actingAs($user)
        ->get(route('surveys.ai.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/ai/Index')
            ->where('input.survey_name', 'Support Survey')
            ->where('draft.survey_name', 'Customer Pulse')
            ->has('draft.questions', 2)
            ->where('draft.questions.0.response_type', 'multiple-choice')
        );

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = $request->data();

        return $request->url() === 'https://api.openai.com/v1/chat/completions'
            && ($payload['model'] ?? null) === 'gpt-4o-mini'
            && ($payload['response_format']['type'] ?? null) === 'json_object'
            && str_contains((string) ($payload['messages'][1]['content'] ?? ''), 'Customer support feedback survey');
    });
});

test('ai survey generation enforces mixed question types when draft is all free text', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    config()->set('services.openai.api_key', 'test-key');
    config()->set('services.openai.base_url', 'https://api.openai.com/v1');
    config()->set('services.openai.model', 'gpt-4o-mini');

    $freeTextDraft = [
        'survey_name' => 'Text Only',
        'questions' => [
            [
                'question' => 'Describe your recent experience.',
                'response_type' => 'free-text',
                'options' => [],
            ],
            [
                'question' => 'What did you like most?',
                'response_type' => 'free-text',
                'options' => [],
            ],
            [
                'question' => 'What should we improve?',
                'response_type' => 'free-text',
                'options' => [],
            ],
            [
                'question' => 'Any other feedback?',
                'response_type' => 'free-text',
                'options' => [],
            ],
        ],
    ];

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::sequence()
            ->push([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($freeTextDraft, JSON_THROW_ON_ERROR),
                        ],
                    ],
                ],
            ], 200)
            ->push([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($freeTextDraft, JSON_THROW_ON_ERROR),
                        ],
                    ],
                ],
            ], 200),
    ]);

    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->post(route('surveys.ai.generate'), [
            'survey_name' => 'Text Only',
            'description' => 'All free text please.',
        ])
        ->assertRedirect(route('surveys.ai.index'));

    $this
        ->actingAs($user)
        ->get(route('surveys.ai.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/ai/Index')
            ->where('draft.questions.0.response_type', 'multiple-choice')
            ->where('draft.questions.1.response_type', 'multiple-choice')
            ->where('draft.questions.2.response_type', 'free-text')
        );

    Http::assertSentCount(2);
});

test('ai survey draft can be sent to the survey builder', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->post(route('surveys.ai.apply'), [
            'survey_name' => 'Employee Satisfaction',
            'description' => 'Feedback survey for engineering team.',
            'questions' => [
                [
                    'question' => 'How would you rate your current workload?',
                    'response_type' => 'multiple-choice',
                    'options' => ['Light', 'Balanced', 'Heavy'],
                    'allow_multiple' => false,
                    'branching' => ['1', '1', '1'],
                ],
                [
                    'question' => 'Which benefits matter most to you?',
                    'response_type' => 'multiple-choice',
                    'options' => ['Compensation', 'Flexibility', 'Career growth'],
                    'allow_multiple' => true,
                    'branching' => '2',
                ],
                [
                    'question' => 'What would improve your day-to-day work?',
                    'response_type' => 'free-text',
                    'options' => [],
                    'branching' => '-1',
                ],
            ],
        ])
        ->assertRedirect(route('questions.create'));

    $this
        ->actingAs($user)
        ->get(route('questions.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/question/Create')
            ->where('aiDraft.survey_name', 'Employee Satisfaction')
            ->has('aiDraft.questions', 3)
            ->where('aiDraft.questions.0.response_type', 'multiple-choice')
            ->where('aiDraft.questions.1.allow_multiple', true)
            ->where('aiDraft.questions.1.branching', '2')
            ->where('aiDraft.questions.2.branching', '-1')
            ->where('aiDraft.questions.0.branching.0', '1')
        );
});
