<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Carbon\Carbon;
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
    $lockedEditResponse = $this->actingAs($user)->put(route('surveys.questions.update', [$survey, $question]), [
        'question' => 'Attempted update while scheduled',
        'response_type' => 'free-text',
        'free_text_description' => 'Attempted',
    ]);
    $lockedEditResponse->assertForbidden();

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
