<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\SurveyMessage;
use App\Models\User;

test('sms:test command simulates inbound trigger message', function (): void {
    config()->set('services.sms.driver', 'log');

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '254748815593',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Command Survey',
        'description' => 'Command test',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'test',
        'completion_message' => null,
        'invitation_message' => 'Reply with test to participate.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $survey->questions()->create([
        'question' => 'Which type of car do you own?',
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

    $this->artisan('sms:test', [
        'phone' => '254748815593',
        'message' => 'test',
    ])
        ->expectsOutputToContain('processed: true')
        ->expectsOutputToContain('status: question_dispatched')
        ->assertExitCode(0);

    $pivot = $survey->contacts()->whereKey($contact->id)->first()?->pivot;
    expect($pivot?->sms_flow_state)->not->toBeNull();

    $messageLog = SurveyMessage::query()
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->where('direction', 'inbound')
        ->latest('created_at')
        ->first();

    expect($messageLog)->not->toBeNull();
    expect($messageLog?->payload)->toMatchArray([
        'MSISDN' => '254748815593',
        'txtMessage' => 'test',
    ]);
});
