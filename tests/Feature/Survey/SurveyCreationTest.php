<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
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
