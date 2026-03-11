<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\SurveyMessage;
use App\Models\SurveyResponse;
use App\Models\SurveyResponseAnswer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated user can create a survey with questions, options and recipients', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contacts = Contact::factory()->count(2)->create([
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'active',
            'surveyName' => 'Customer Satisfaction Survey',
            'description' => 'Quarterly customer feedback survey',
            'startDate' => '2026-02-24',
            'endDate' => '2026-03-24',
            'triggerWord' => 'SAT2026',
            'completionMessage' => 'Thanks for your feedback.',
            'invitationMessage' => 'Reply START to participate.',
            'scheduleTime' => '2026-02-25 10:00:00',
            'questions' => [
                [
                    'question' => 'How do you rate our service?',
                    'responseType' => 'multiple-choice',
                    'options' => ['Excellent', 'Good'],
                    'allowMultiple' => false,
                    'branching' => [1, -1],
                ],
                [
                    'question' => 'What can we improve?',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'freeTextDescription' => 'Share your ideas',
                    'branching' => -1,
                ],
            ],
            'recipients' => $contacts->map(fn (Contact $contact): array => ['id' => $contact->id])->toArray(),
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'SAT2026')->first();

    expect($survey)->not->toBeNull();
    if ($survey === null) {
        return;
    }

    expect($survey->status)->toBe('active');
    expect($survey->questions)->toHaveCount(2);
    expect($survey->questions()->first()->options)->toHaveCount(2);

    foreach ($contacts as $contact) {
        $this->assertDatabaseHas('contact_survey', [
            'survey_id' => $survey->id,
            'contact_id' => $contact->id,
            'sent_at' => '2026-02-25 10:00:00',
        ]);
    }
});

test('authenticated user can save survey as draft without recipients or schedule', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'draft',
            'surveyName' => 'Draft Survey',
            'description' => 'Draft only',
            'startDate' => '2026-02-24',
            'endDate' => '2026-03-24',
            'triggerWord' => 'DRAFT2026',
            'completionMessage' => null,
            'invitationMessage' => null,
            'scheduleTime' => null,
            'questions' => [
                [
                    'question' => 'Draft question',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => [],
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'DRAFT2026')->first();

    expect($survey)->not->toBeNull();
    if ($survey === null) {
        return;
    }

    expect($survey->status)->toBe('draft');
    expect($survey->questions()->count())->toBe(1);
    expect($survey->contacts()->count())->toBe(0);
});

test('active survey creation normalizes datetime-local schedule to database datetime format', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'active',
            'surveyName' => 'DateTime Local Survey',
            'description' => 'Ensures sent_at is normalized',
            'startDate' => now()->toDateString(),
            'endDate' => now()->addDay()->toDateString(),
            'triggerWord' => 'DATETIME-LOCAL-2026',
            'completionMessage' => 'Thanks',
            'invitationMessage' => 'Reply START to continue.',
            'scheduleTime' => '2026-03-06T11:57',
            'questions' => [
                [
                    'question' => 'How are you?',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => [
                ['id' => $contact->id],
            ],
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'DATETIME-LOCAL-2026')->firstOrFail();
    $sentAt = (string) DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->value('sent_at');

    expect($sentAt)->toBe('2026-03-06 11:57:00');
    expect($survey->scheduled_time?->toDateTimeString())->toBe('2026-03-06 11:57:00');
});

test('survey stores option child-question flow and branching metadata', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'draft',
            'surveyName' => 'Branching Child Flow Survey',
            'description' => 'Survey with child question definitions',
            'startDate' => '2026-02-24',
            'endDate' => '2026-03-24',
            'triggerWord' => 'CHILD-FLOW-2026',
            'completionMessage' => null,
            'invitationMessage' => null,
            'scheduleTime' => null,
            'questions' => [
                [
                    'question' => 'Choose your preferred service',
                    'responseType' => 'multiple-choice',
                    'options' => ['Internet', 'Voice'],
                    'allowMultiple' => false,
                    'branching' => [1, -1],
                    'childQuestionStates' => [
                        [
                            'followUpBranching' => 1,
                            'childQuestions' => [
                                [
                                    'question' => 'Why do you prefer Internet?',
                                    'responseType' => 'free-text',
                                    'branching' => -1,
                                    'allowMultiple' => false,
                                    'isSaved' => true,
                                ],
                            ],
                        ],
                        null,
                    ],
                ],
                [
                    'question' => 'Any other feedback?',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => [],
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'CHILD-FLOW-2026')->first();
    expect($survey)->not->toBeNull();

    if ($survey === null) {
        return;
    }

    $firstQuestion = $survey->questions()->orderBy('order')->first();
    expect($firstQuestion)->not->toBeNull();

    if ($firstQuestion === null) {
        return;
    }

    $firstOption = $firstQuestion->options()->orderBy('order')->first();
    expect($firstOption)->not->toBeNull();

    if ($firstOption === null) {
        return;
    }

    $optionBranching = $firstOption->branching;

    expect($optionBranching)->toBeArray();
    expect($optionBranching['next_question'] ?? null)->toBe(1);
    expect($optionBranching['follow_up_after_children'] ?? null)->toBe(1);
    expect($optionBranching['child_questions'] ?? null)->toBeArray();
    expect($optionBranching['child_questions'][0]['question'] ?? null)->toBe('Why do you prefer Internet?');
    expect($optionBranching['child_questions'][0]['after_answer_go_to'] ?? null)->toBe(-1);
});

test('user cannot create a survey using recipients from another account', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $anotherUser = User::factory()->create();
    $otherUsersContact = Contact::factory()->create([
        'user_id' => $anotherUser->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'surveyName' => 'Invalid Recipient Survey',
            'description' => 'This should fail validation',
            'startDate' => '2026-02-24',
            'endDate' => '2026-03-24',
            'triggerWord' => 'INVALID-RECIPIENT',
            'completionMessage' => null,
            'invitationMessage' => 'Reply START to participate.',
            'scheduleTime' => '2026-02-25 10:00:00',
            'questions' => [
                [
                    'question' => 'Test question?',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => [
                ['id' => $otherUsersContact->id],
            ],
        ]);

    $response->assertSessionHasErrors('recipients.0.id');
    $this->assertDatabaseMissing('surveys', [
        'trigger_word' => 'INVALID-RECIPIENT',
    ]);
});

test('survey index is paginated and scoped to authenticated user', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    foreach (range(1, 12) as $index) {
        Survey::query()->create([
            'name' => "My Survey {$index}",
            'description' => "Description {$index}",
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'trigger_word' => "MY-TRIGGER-{$index}",
            'completion_message' => null,
            'invitation_message' => 'Reply START',
            'scheduled_time' => now()->addDay(),
            'status' => 'draft',
            'created_by' => $user->id,
        ]);
    }

    Survey::query()->create([
        'name' => 'Other User Survey',
        'description' => 'Other user survey description',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'OTHER-USER-TRIGGER',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $otherUser->id,
    ]);

    $response = $this->actingAs($user)->get(route('questions.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/Index')
            ->has('surveys.data', 10)
            ->where('surveys.total', 12)
            ->has('surveys.links')
        );
});

test('survey responses page is scoped to owner and returns paginated recipients', function (): void {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Responses Survey',
        'description' => 'Survey with recipients',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'RESPONSES',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $ownerContacts = Contact::factory()->count(12)->create([
        'user_id' => $owner->id,
    ]);

    foreach ($ownerContacts as $index => $contact) {
        $survey->contacts()->attach($contact->id, [
            'sent_at' => $index < 8 ? now() : null,
        ]);
    }

    $response = $this->actingAs($owner)->get(route('surveys.responses', $survey));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/Responses')
            ->where('survey.id', $survey->id)
            ->where('stats.total_recipients', 12)
            ->where('stats.sent_recipients', 8)
            ->where('stats.pending_recipients', 4)
            ->has('recipients.data', 10)
        );

    $forbiddenResponse = $this->actingAs($otherUser)->get(route('surveys.responses', $survey));
    $forbiddenResponse->assertNotFound();
});

test('survey responses page tracks completion and response status', function (): void {
    $owner = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Completion Survey',
        'description' => 'Survey with completion tracking',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'COMPLETE-TRACK',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $pendingContact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Alpha',
    ]);
    $awaitingContact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Bravo',
    ]);
    $inProgressContact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Charlie',
    ]);
    $completedContact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Delta',
    ]);

    $survey->contacts()->attach($pendingContact->id, [
        'sent_at' => null,
    ]);
    $survey->contacts()->attach($awaitingContact->id, [
        'sent_at' => now(),
    ]);
    $survey->contacts()->attach($inProgressContact->id, [
        'sent_at' => now(),
        'sms_flow_started_at' => now(),
    ]);
    $survey->contacts()->attach($completedContact->id, [
        'sent_at' => now(),
        'sms_flow_started_at' => now(),
        'sms_flow_completed_at' => now(),
    ]);

    $response = $this->actingAs($owner)->get(route('surveys.responses', $survey));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/Responses')
            ->where('stats.sent_recipients', 3)
            ->where('stats.pending_recipients', 1)
            ->where('stats.started_recipients', 2)
            ->where('stats.completed_recipients', 1)
            ->where('stats.response_count', 2)
            ->where('recipients.data.0.names', 'Alpha')
            ->where('recipients.data.0.response_status', 'pending_send')
            ->where('recipients.data.1.names', 'Bravo')
            ->where('recipients.data.1.response_status', 'awaiting_response')
            ->where('recipients.data.2.names', 'Charlie')
            ->where('recipients.data.2.response_status', 'in_progress')
            ->where('recipients.data.3.names', 'Delta')
            ->where('recipients.data.3.response_status', 'completed')
        );
});

test('survey responses page aggregates per-question answers', function (): void {
    $owner = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Analytics Survey',
        'description' => 'Tracks per-question counts',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'ANALYTICS',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $freeTextQuestion = $survey->questions()->create([
        'question' => 'Which type of car do you own?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $choiceQuestion = $survey->questions()->create([
        'question' => 'What fuel do you use?',
        'response_type' => 'multiple-choice',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 1,
        'branching' => null,
    ]);

    $choiceQuestion->options()->createMany([
        ['option' => 'Petrol', 'order' => 0, 'branching' => null],
        ['option' => 'Diesel', 'order' => 1, 'branching' => null],
    ]);

    $contacts = Contact::factory()->count(2)->create([
        'user_id' => $owner->id,
    ]);

    foreach ($contacts as $contact) {
        $survey->contacts()->attach($contact->id, [
            'sent_at' => now(),
        ]);
    }

    $responses = $contacts->map(function (Contact $contact) use ($survey): SurveyResponse {
        return SurveyResponse::query()->create([
            'survey_id' => $survey->id,
            'contact_id' => $contact->id,
            'started_at' => now(),
        ]);
    });

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $responses[0]->id,
        'question_id' => $freeTextQuestion->id,
        'answer_text' => 'SUV',
    ]);

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $responses[0]->id,
        'question_id' => $choiceQuestion->id,
        'option_id' => $choiceQuestion->options()->orderBy('order')->first()?->id,
    ]);

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $responses[1]->id,
        'question_id' => $freeTextQuestion->id,
        'answer_text' => 'Sedan',
    ]);

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $responses[1]->id,
        'question_id' => $choiceQuestion->id,
        'option_id' => $choiceQuestion->options()->orderBy('order')->skip(1)->first()?->id,
    ]);

    $response = $this->actingAs($owner)->get(route('surveys.responses', $survey));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/Responses')
            ->where('question_analytics.0.id', $freeTextQuestion->id)
            ->where('question_analytics.0.total_responses', 2)
            ->where('question_analytics.0.free_text_count', 2)
            ->where('question_analytics.1.id', $choiceQuestion->id)
            ->where('question_analytics.1.total_responses', 2)
            ->where('question_analytics.1.options.0.count', 1)
            ->where('question_analytics.1.options.1.count', 1)
        );
});

test('survey response detail page shows answers for a recipient', function (): void {
    $owner = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Detail Survey',
        'description' => 'Single response details',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'DETAILS',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Which type of car do you own?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $contact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Jane Doe',
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'sms_flow_started_at' => now(),
    ]);

    $response = SurveyResponse::query()->create([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'started_at' => now(),
    ]);

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $response->id,
        'question_id' => $question->id,
        'answer_text' => 'SUV',
    ]);

    SurveyMessage::query()->create([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'direction' => 'outbound',
        'phone' => '254700000000',
        'delivery_status' => 'sent',
        'message' => 'Q1: Which type of car do you own?',
    ]);

    SurveyMessage::query()->create([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'phone' => '254700000000',
        'delivery_status' => 'received',
        'resolved_option_text' => 'SUV',
        'message' => 'SUV',
    ]);

    $detailResponse = $this->actingAs($owner)->get(route('surveys.responses.show', [$survey, $contact]));

    $detailResponse
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/ResponseDetail')
            ->where('recipient.names', 'Jane Doe')
            ->where('response.answers.0.question', 'Which type of car do you own?')
            ->where('response.answers.0.answer', 'SUV')
            ->where('response.messages.0.direction', 'outbound')
            ->where('response.messages.0.delivery_status', 'sent')
            ->where('response.messages.1.direction', 'inbound')
            ->where('response.messages.1.delivery_status', 'received')
            ->where('response.messages.1.resolved_option_text', 'SUV')
        );
});

test('survey answers export includes per-question columns', function (): void {
    $owner = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Export Survey',
        'description' => 'Exports answers',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'EXPORT',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Which type of car do you own?',
        'response_type' => 'free-text',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $contact = Contact::factory()->create([
        'user_id' => $owner->id,
        'names' => 'Jane Doe',
        'phone' => '254700000000',
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
    ]);

    $response = SurveyResponse::query()->create([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'started_at' => now(),
    ]);

    SurveyResponseAnswer::query()->create([
        'survey_response_id' => $response->id,
        'question_id' => $question->id,
        'answer_text' => 'SUV',
    ]);

    $exportResponse = $this->actingAs($owner)->get(route('surveys.responses', $survey).'?export=answers_csv');

    $content = $exportResponse->streamedContent();

    expect($content)->toContain('Q1: Which type of car do you own?');
    expect($content)->toContain('Jane Doe');
    expect($content)->toContain('SUV');
});

test('survey responses index is scoped and paginated for authenticated user', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    foreach (range(1, 11) as $index) {
        Survey::query()->create([
            'name' => "Response Survey {$index}",
            'description' => "Response description {$index}",
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'trigger_word' => "RESP-{$index}",
            'completion_message' => null,
            'invitation_message' => 'Reply START',
            'scheduled_time' => now()->addDay(),
            'status' => 'draft',
            'created_by' => $user->id,
        ]);
    }

    Survey::query()->create([
        'name' => 'Other User Response Survey',
        'description' => 'Should not be visible',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'OTHER-RESP',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $otherUser->id,
    ]);

    $response = $this->actingAs($user)->get(route('surveys.responses.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('surveys/question/ResponsesIndex')
            ->has('surveys.data', 10)
            ->where('surveys.total', 11)
        );
});

test('survey owner can edit a question from survey details page', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Survey To Edit Question',
        'description' => 'Original description',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'EDIT-QUESTION',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Old question text',
        'response_type' => 'multiple-choice',
        'free_text_description' => null,
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $question->options()->createMany([
        ['option' => 'Option A', 'order' => 0],
        ['option' => 'Option B', 'order' => 1],
    ]);

    $response = $this->actingAs($owner)->put(route('surveys.questions.update', [$survey, $question]), [
        'question' => 'Updated question text',
        'response_type' => 'multiple-choice',
        'allow_multiple' => true,
        'options' => [
            ['option' => 'New Option 1'],
            ['option' => 'New Option 2'],
            ['option' => 'New Option 3'],
        ],
    ]);

    $response->assertRedirect(route('surveys.show', $survey));

    $question->refresh();

    expect($question->question)->toBe('Updated question text');
    expect($question->allow_multiple)->toBeTruthy();
    expect($question->options()->count())->toBe(3);
    expect($question->options()->pluck('option')->all())->toBe([
        'New Option 1',
        'New Option 2',
        'New Option 3',
    ]);
});

test('survey owner can add a new question from survey details page when survey is draft', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Survey Add Question Draft',
        'description' => 'Draft survey for adding question',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'ADD-QUESTION-DRAFT',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->post(route('surveys.questions.store', $survey), [
        'question' => 'What is your preferred channel?',
        'response_type' => 'multiple-choice',
        'allow_multiple' => false,
        'branching' => -1,
        'options' => [
            ['option' => 'SMS'],
            ['option' => 'WhatsApp'],
        ],
    ]);

    $response->assertRedirect(route('surveys.show', $survey));

    $newQuestion = $survey->fresh()?->questions()->orderByDesc('order')->first();
    expect($newQuestion)->not->toBeNull();

    if ($newQuestion === null) {
        return;
    }

    expect($newQuestion->question)->toBe('What is your preferred channel?');
    expect($newQuestion->response_type)->toBe('multiple-choice');
    expect($newQuestion->options()->count())->toBe(2);
    expect($newQuestion->branching)->toBeArray();
    expect($newQuestion->branching['next_question'] ?? null)->toBe(-1);
});

test('active survey cannot have new questions added', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Active Survey Add Question Locked',
        'description' => 'Active survey should be locked',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'ADD-QUESTION-ACTIVE',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->post(route('surveys.questions.store', $survey), [
        'question' => 'Attempted question on active survey',
        'response_type' => 'free-text',
        'free_text_description' => 'Attempted',
    ]);

    $response->assertForbidden();
    expect($survey->fresh()?->questions()->count())->toBe(0);
});

test('survey owner can update survey details when survey is draft', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Original Draft Survey Name',
        'description' => 'Original draft description',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'ORIGINAL-DRAFT-TRIGGER',
        'completion_message' => 'Original completion',
        'invitation_message' => 'Original invitation',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->put(route('surveys.update', $survey), [
        'surveyName' => 'Updated Draft Survey Name',
        'description' => 'Updated draft description',
        'startDate' => now()->addDay()->toDateString(),
        'endDate' => now()->addDays(10)->toDateString(),
        'triggerWord' => 'UPDATED-DRAFT-TRIGGER',
        'invitationMessage' => 'Updated invitation message',
        'completionMessage' => 'Updated completion message',
        'scheduleTime' => now()->addDays(2)->format('Y-m-d H:i:s'),
    ]);

    $response->assertRedirect(route('surveys.show', $survey));

    $survey->refresh();

    expect($survey->name)->toBe('Updated Draft Survey Name');
    expect($survey->description)->toBe('Updated draft description');
    expect($survey->trigger_word)->toBe('UPDATED-DRAFT-TRIGGER');
    expect($survey->invitation_message)->toBe('Updated invitation message');
    expect($survey->completion_message)->toBe('Updated completion message');
});

test('active survey details cannot be edited', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Locked Active Survey',
        'description' => 'Active surveys should be locked',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'LOCKED-ACTIVE-TRIGGER',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $response = $this->actingAs($owner)->put(route('surveys.update', $survey), [
        'surveyName' => 'Attempted Active Update',
        'description' => 'Attempted update',
        'startDate' => now()->toDateString(),
        'endDate' => now()->addDays(3)->toDateString(),
        'triggerWord' => 'ATTEMPTED-ACTIVE-UPDATE',
        'invitationMessage' => 'Attempted invitation',
        'completionMessage' => 'Attempted completion',
        'scheduleTime' => now()->addHour()->format('Y-m-d H:i:s'),
    ]);

    $response->assertForbidden();
    expect($survey->refresh()->name)->toBe('Locked Active Survey');
});

test('survey owner can delete survey from survey details page', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Survey To Delete',
        'description' => 'Will be deleted',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'DELETE-SURVEY',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Question tied to deleted survey',
        'response_type' => 'free-text',
        'free_text_description' => 'Details',
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $response = $this->actingAs($owner)->delete(route('surveys.destroy', $survey));

    $response->assertRedirect(route('questions.index'));

    $this->assertDatabaseMissing('surveys', ['id' => $survey->id]);
    $this->assertDatabaseMissing('questions', ['id' => $question->id]);
});

test('non owner cannot edit or delete another users survey', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Protected Survey',
        'description' => 'Should be protected',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'PROTECTED-SURVEY',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Protected question',
        'response_type' => 'free-text',
        'free_text_description' => 'Original',
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $editResponse = $this->actingAs($otherUser)->put(route('surveys.questions.update', [$survey, $question]), [
        'question' => 'Attempted update',
        'response_type' => 'free-text',
        'free_text_description' => 'Attempted description',
    ]);

    $editResponse->assertNotFound();

    $deleteResponse = $this->actingAs($otherUser)->delete(route('surveys.destroy', $survey));
    $deleteResponse->assertNotFound();

    $question->refresh();
    expect($question->question)->toBe('Protected question');
    $this->assertDatabaseHas('surveys', ['id' => $survey->id]);
});

test('published surveys cannot have questions edited', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();

    $survey = Survey::query()->create([
        'name' => 'Published Survey',
        'description' => 'Published and locked',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'PUBLISHED-LOCKED',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $question = $survey->questions()->create([
        'question' => 'Original published question',
        'response_type' => 'free-text',
        'free_text_description' => 'Original description',
        'allow_multiple' => false,
        'order' => 0,
        'branching' => null,
    ]);

    $response = $this->actingAs($owner)->put(route('surveys.questions.update', [$survey, $question]), [
        'question' => 'Attempted update',
        'response_type' => 'free-text',
        'free_text_description' => 'Attempted description',
    ]);

    $response->assertForbidden();
    expect($question->refresh()->question)->toBe('Original published question');
});

test('scheduled published survey stays draft until start date then becomes active and later completed', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
    ]);

    Carbon::setTestNow('2026-02-27 09:00:00');

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'active',
            'surveyName' => 'Scheduled Survey',
            'description' => 'Should activate on start date',
            'startDate' => '2026-03-01',
            'endDate' => '2026-03-03',
            'triggerWord' => 'SCHEDULED-TRACK',
            'completionMessage' => null,
            'invitationMessage' => 'Reply START',
            'scheduleTime' => '2026-03-01 10:00:00',
            'questions' => [
                [
                    'question' => 'Scheduled question',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => [
                ['id' => $contact->id],
            ],
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'SCHEDULED-TRACK')->firstOrFail();
    expect($survey->status)->toBe('draft');
    expect($survey->contacts()->whereNotNull('contact_survey.sent_at')->count())->toBe(1);

    $question = $survey->questions()->firstOrFail();
    $draftEditResponse = $this->actingAs($user)->put(route('surveys.questions.update', [$survey, $question]), [
        'question' => 'Updated while still draft',
        'response_type' => 'free-text',
        'free_text_description' => 'Updated while draft',
    ]);
    $draftEditResponse->assertRedirect(route('surveys.show', $survey));
    expect($question->fresh()->question)->toBe('Updated while still draft');

    Carbon::setTestNow('2026-03-01 12:00:00');
    $this->artisan('surveys:sync-statuses')->assertSuccessful();
    expect($survey->fresh()?->status)->toBe('active');

    Carbon::setTestNow('2026-03-04 00:01:00');
    $this->artisan('surveys:sync-statuses')->assertSuccessful();
    expect($survey->fresh()?->status)->toBe('completed');

    Carbon::setTestNow();
});

test('owner can cancel survey and cancelled survey is not transitioned by sync command', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Cancelable Survey',
        'description' => 'Can be cancelled',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'trigger_word' => 'CANCEL-TRACK',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $owner->id,
    ]);

    $cancelResponse = $this->actingAs($owner)->patch(route('surveys.cancel', $survey));
    $cancelResponse->assertRedirect(route('surveys.show', $survey));
    expect($survey->fresh()?->status)->toBe('cancelled');

    $this->artisan('surveys:sync-statuses')->assertSuccessful();
    expect($survey->fresh()?->status)->toBe('cancelled');
});

test('owner can reactivate cancelled survey', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $owner = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $owner->id,
    ]);

    $survey = Survey::query()->create([
        'name' => 'Reactivatable Survey',
        'description' => 'Can be reactivated',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'trigger_word' => 'REACTIVATE-TRACK',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'cancelled',
        'created_by' => $owner->id,
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
    ]);

    $response = $this->actingAs($owner)->patch(route('surveys.reactivate', $survey));

    $response->assertRedirect(route('surveys.show', $survey));
    expect($survey->fresh()?->status)->toBe('active');
});
