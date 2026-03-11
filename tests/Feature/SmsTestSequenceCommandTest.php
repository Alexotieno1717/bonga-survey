<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;

test('sms:test-sequence command runs a full conversation', function (): void {
    config()->set('services.sms.driver', 'log');

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'phone' => '254748815593',
    ]);

    $survey = Survey::query()->create([
        'name' => 'Sequence Survey',
        'description' => 'Sequence test',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'trigger_word' => 'test',
        'completion_message' => null,
        'invitation_message' => 'Reply with test to participate.',
        'scheduled_time' => now(),
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $survey->questions()->createMany([
        [
            'question' => 'Which type of car do you own?',
            'response_type' => 'free-text',
            'free_text_description' => null,
            'allow_multiple' => false,
            'order' => 0,
            'branching' => null,
        ],
        [
            'question' => 'Which model of the car?',
            'response_type' => 'free-text',
            'free_text_description' => null,
            'allow_multiple' => false,
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

    $this->artisan('sms:test-sequence', [
        'phone' => '254748815593',
        'messages' => ['test', 'SUV', 'RAV4'],
    ])
        ->expectsOutputToContain('status: question_dispatched')
        ->expectsOutputToContain('status: survey_completed')
        ->assertExitCode(0);

    $response = SurveyResponse::query()
        ->where('survey_id', $survey->id)
        ->where('contact_id', $contact->id)
        ->first();

    expect($response)->not->toBeNull();
    expect($response?->completed_at)->not->toBeNull();
});
