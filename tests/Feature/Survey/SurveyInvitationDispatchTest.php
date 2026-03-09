<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config()->set('services.sms.url', 'http://167.172.14.50:4002/v1/send-sms');
    config()->set('services.sms.client_id', '1028');
    config()->set('services.sms.key', 'test-key');
    config()->set('services.sms.secret', 'test-secret');
    config()->set('services.sms.service_id', '1');
    config()->set('services.sms.retry_attempts', 2);
    config()->set('services.sms.retry_base_delay_ms', 0);
});

test('publish now dispatches invitation sms immediately for active survey recipients', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    Carbon::setTestNow('2026-03-05 10:00:00');

    Http::fake([
        'http://167.172.14.50:4002/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'msg-1',
        ], 200),
    ]);

    $user = User::factory()->create();
    $contacts = Contact::factory()->count(2)->create([
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('questions.store'), [
            'status' => 'active',
            'surveyName' => 'Immediate SMS Dispatch Survey',
            'description' => 'Should send instantly',
            'startDate' => '2026-03-05',
            'endDate' => '2026-03-07',
            'triggerWord' => 'IMMEDIATE-SMS-2026',
            'completionMessage' => 'Thanks!',
            'invitationMessage' => 'Reply START to participate.',
            'scheduleTime' => '2026-03-05 10:00:00',
            'questions' => [
                [
                    'question' => 'How was your experience?',
                    'responseType' => 'free-text',
                    'allowMultiple' => false,
                    'branching' => -1,
                ],
            ],
            'recipients' => $contacts->map(fn (Contact $contact): array => ['id' => $contact->id])->toArray(),
        ]);

    $response->assertRedirect(route('questions.index'));

    $survey = Survey::query()->where('trigger_word', 'IMMEDIATE-SMS-2026')->firstOrFail();

    $sentCount = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->whereNotNull('invitation_dispatched_at')
        ->count();

    expect($sentCount)->toBe(2);
    Http::assertSentCount(2);

    Carbon::setTestNow();
});

test('send invitations command dispatches only due and undelivered invitations', function (): void {
    Http::fake([
        'http://167.172.14.50:4002/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'msg-2',
        ], 200),
    ]);

    $user = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Scheduled SMS Dispatch Survey',
        'description' => 'Dispatch via command',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'COMMAND-SMS-2026',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $dueContact = Contact::factory()->create(['user_id' => $user->id]);
    $futureContact = Contact::factory()->create(['user_id' => $user->id]);
    $alreadySentContact = Contact::factory()->create(['user_id' => $user->id]);

    $survey->contacts()->attach($dueContact->id, [
        'sent_at' => now()->subMinute(),
        'invitation_dispatched_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $survey->contacts()->attach($futureContact->id, [
        'sent_at' => now()->addMinutes(10),
        'invitation_dispatched_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $survey->contacts()->attach($alreadySentContact->id, [
        'sent_at' => now()->subMinute(),
        'invitation_dispatched_at' => now()->subSeconds(20),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('surveys:send-invitations')
        ->assertSuccessful();

    $dueDispatchTimestamp = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $dueContact->id)
        ->value('invitation_dispatched_at');
    $futureDispatchTimestamp = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $futureContact->id)
        ->value('invitation_dispatched_at');
    $alreadySentDispatchTimestamp = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $alreadySentContact->id)
        ->value('invitation_dispatched_at');

    expect($dueDispatchTimestamp)->not->toBeNull();
    expect($futureDispatchTimestamp)->toBeNull();
    expect($alreadySentDispatchTimestamp)->not->toBeNull();

    Http::assertSentCount(1);

    $this->artisan('surveys:send-invitations')
        ->assertSuccessful();

    Http::assertSentCount(1);
});

test('send invitations command treats iso-style sent_at timestamps as due', function (): void {
    Http::fake([
        'http://167.172.14.50:4002/*' => Http::response([
            'status' => 222,
            'status_message' => 'success',
            'unique_id' => 'msg-3',
        ], 200),
    ]);

    Carbon::setTestNow('2026-03-06 12:00:00');

    $user = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'ISO Schedule Survey',
        'description' => 'Handles datetime-local format',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'ISO-DUE-2026',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->subMinute(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $contact = Contact::factory()->create(['user_id' => $user->id]);

    DB::table('contact_survey')->insert([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'sent_at' => '2026-03-06T11:57',
        'invitation_dispatched_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('surveys:send-invitations')
        ->assertSuccessful();

    $dispatchTimestamp = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->value('invitation_dispatched_at');

    expect($dispatchTimestamp)->not->toBeNull();
    Http::assertSentCount(1);

    Carbon::setTestNow();
});

test('send invitations command retries transient sms gateway failure and succeeds', function (): void {
    Http::fake([
        'http://167.172.14.50:4002/*' => Http::sequence()
            ->push('', 500)
            ->push([
                'status' => 222,
                'status_message' => 'success',
                'unique_id' => 'msg-retry',
            ], 200),
    ]);

    $user = User::factory()->create();
    $survey = Survey::query()->create([
        'name' => 'Retry SMS Dispatch Survey',
        'description' => 'Retries transient errors',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'RETRY-SMS-2026',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $contact = Contact::factory()->create(['user_id' => $user->id]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now()->subMinute(),
        'invitation_dispatched_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('surveys:send-invitations')
        ->assertSuccessful();

    $dispatchTimestamp = DB::table('contact_survey')
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->value('invitation_dispatched_at');

    expect($dispatchTimestamp)->not->toBeNull();
    Http::assertSentCount(2);
});
