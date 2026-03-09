<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config()->set('services.sms.url', 'http://sms-gateway.test/send-sms');
    config()->set('services.sms.client_id', '1028');
    config()->set('services.sms.key', 'test-key');
    config()->set('services.sms.secret', 'test-secret');
    config()->set('services.sms.service_id', '1');
});

test('inbound trigger dispatches first question for matching active survey contact', function (): void {
    Http::fake([
        'http://sms-gateway.test/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'sms-1001',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '+254748815593',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Customer Pulse',
        'description' => 'Weekly pulse check',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'START',
        'completion_message' => null,
        'invitation_message' => 'Reply START to begin.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $firstQuestion = $survey->questions()->create([
        'question' => 'How satisfied are you with our service?',
        'response_type' => 'multiple-choice',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $firstQuestion->options()->createMany([
        ['option' => 'Very satisfied', 'order' => 0, 'branching' => null],
        ['option' => 'Not satisfied', 'order' => 1, 'branching' => null],
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815593',
        'txtMessage' => '  start ',
    ]);

    $response->assertOk()
        ->assertJson([
            'processed' => true,
            'status' => 'question_dispatched',
        ]);

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $phonePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'MSISDN');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';
        $phone = is_array($phonePart) ? (string) ($phonePart['contents'] ?? '') : '';

        return str_contains($message, 'Q1: How satisfied are you with our service?')
            && str_contains($message, '1. Very satisfied')
            && str_contains($message, '2. Not satisfied')
            && $phone === '+254748815593';
    });
});

test('inbound message with non-matching trigger does not dispatch question', function (): void {
    Http::fake();

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '254748815594',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Household Survey',
        'description' => 'Household baseline',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'START',
        'completion_message' => null,
        'invitation_message' => 'Reply START to begin.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $survey->questions()->create([
        'question' => 'What is your age group?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815594',
        'txtMessage' => 'HELLO',
    ]);

    $response->assertOk()
        ->assertJson([
            'processed' => false,
            'status' => 'no_matching_survey',
        ]);

    Http::assertNothingSent();
});

test('inbound replies progress through parent questions and send completion message', function (): void {
    Http::fake([
        'http://sms-gateway.test/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'sms-2001',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '+254748815595',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Progress Survey',
        'description' => 'Tracks question progression',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'ET',
        'completion_message' => 'Thanks for completing the survey.',
        'invitation_message' => 'Reply with ET to participate.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $firstQuestion = $survey->questions()->create([
        'question' => 'Do you use our service weekly?',
        'response_type' => 'multiple-choice',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => [1, -1],
    ]);
    $firstQuestion->options()->createMany([
        ['option' => 'Yes', 'order' => 0, 'branching' => null],
        ['option' => 'No', 'order' => 1, 'branching' => null],
    ]);

    $survey->questions()->create([
        'question' => 'What do you like most?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 1,
        'branching' => ['next_question' => -1],
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815595',
        'txtMessage' => 'Et',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'question_dispatched',
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815595',
        'txtMessage' => '1',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'question_dispatched',
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815595',
        'txtMessage' => 'Support is responsive',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'survey_completed',
    ]);

    Http::assertSentCount(3);

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';

        return str_contains($message, 'Q1: Do you use our service weekly?');
    });

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';

        return str_contains($message, 'Q2: What do you like most?');
    });

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';

        return str_contains($message, 'Thanks for completing the survey.');
    });

    $pivot = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->first();

    expect($pivot)->not->toBeNull();
    expect($pivot?->sms_flow_state)->toBeNull();
    expect($pivot?->sms_flow_completed_at)->not->toBeNull();
});

test('inbound replies progress through child question flow like simulator', function (): void {
    Http::fake([
        'http://sms-gateway.test/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'sms-3001',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '+254748815596',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Child Flow Survey',
        'description' => 'Child question behavior',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'ET',
        'completion_message' => 'Completed child flow.',
        'invitation_message' => 'Reply ET to begin.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Choose one service',
        'response_type' => 'multiple-choice',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => [-1, -1],
    ]);

    $question->options()->createMany([
        [
            'option' => 'Internet',
            'order' => 0,
            'branching' => [
                'next_question' => -1,
                'child_questions' => [
                    [
                        'question' => 'Why did you choose Internet?',
                        'response_type' => 'free-text',
                        'allow_multiple' => false,
                        'free_text_description' => null,
                        'order' => 0,
                        'after_answer_go_to' => -1,
                        'options' => [],
                    ],
                ],
                'follow_up_after_children' => -1,
            ],
        ],
        [
            'option' => 'Voice',
            'order' => 1,
            'branching' => null,
        ],
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815596',
        'txtMessage' => 'ET',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'question_dispatched',
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815596',
        'txtMessage' => '1',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'question_dispatched',
    ]);

    $this->postJson('/api/sms/incoming', [
        'MSISDN' => '254748815596',
        'txtMessage' => 'Because it is faster',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'survey_completed',
    ]);

    Http::assertSentCount(3);

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';

        return str_contains($message, 'Q1.1: Why did you choose Internet?');
    });

    Http::assertSent(function (HttpRequest $request): bool {
        $payload = collect($request->data());
        $messagePart = $payload->first(fn (array $part): bool => ($part['name'] ?? null) === 'txtMessage');
        $message = is_array($messagePart) ? (string) ($messagePart['contents'] ?? '') : '';

        return str_contains($message, 'Completed child flow.');
    });
});

test('inbound webhook processes mixed-case and alternate payload keys', function (): void {
    Http::fake([
        'http://sms-gateway.test/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'sms-case-1',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '+254748815598',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Case-insensitive Callback Survey',
        'description' => 'Processes varying gateway key casing',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'ET',
        'completion_message' => 'Done.',
        'invitation_message' => 'Reply ET to begin.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $survey->questions()->create([
        'question' => 'Did callback parsing work?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->postJson('/api/sms/incoming', [
        'mSiSdN' => '254748815598',
        'Content' => 'Et',
    ])->assertOk()->assertJson([
        'processed' => true,
        'status' => 'question_dispatched',
    ]);

    Http::assertSentCount(1);
});

test('inbound webhook accepts get requests on both api and web callback paths', function (): void {
    Http::fake([
        'http://sms-gateway.test/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'sms-get-1',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '+254748815597',
    ]);

    $survey = Survey::query()->create([
        'name' => 'GET Callback Survey',
        'description' => 'Supports callback route compatibility',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'ET',
        'completion_message' => null,
        'invitation_message' => 'Reply ET to begin.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $survey->questions()->create([
        'question' => 'Confirm callback route works?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'invitation_dispatched_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->getJson('/api/sms/incoming?MSISDN=254748815597&txtMessage=ET')
        ->assertOk()
        ->assertJson([
            'processed' => true,
            'status' => 'question_dispatched',
        ]);

    $this->getJson('/sms/incoming?MSISDN=254748815597&txtMessage=ET')
        ->assertOk()
        ->assertJson([
            'processed' => true,
        ]);

    Http::assertSentCount(2);
});
