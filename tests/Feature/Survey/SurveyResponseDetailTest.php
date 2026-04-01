<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\SurveyMessage;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('response detail excludes webhook payload from message log props', function (): void {
    $user = User::factory()->create();
    $survey = Survey::factory()->create([
        'created_by' => $user->id,
        'created_with_ai' => true,
    ]);
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
    ]);

    $survey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $message = SurveyMessage::factory()->create([
        'survey_id' => $survey->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'message' => 'Hello there.',
        'payload' => [
            'MSISDN' => '254700000000',
            'txtMessage' => 'Hello there.',
        ],
    ]);

    $this
        ->actingAs($user)
        ->get(route('surveys.responses.show', [$survey, $contact]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/question/ResponseDetail')
            ->where('survey.created_with_ai', true)
            ->has('response.messages', 1)
            ->where('response.messages.0.id', $message->id)
            ->missing('response.messages.0.payload')
        );
});
