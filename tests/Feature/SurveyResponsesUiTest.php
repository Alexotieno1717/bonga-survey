<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('responses index exposes ai creation flag', function (): void {
    $user = User::factory()->create();

    $manualSurvey = Survey::factory()->create([
        'created_by' => $user->id,
        'created_with_ai' => false,
    ]);

    $aiSurvey = Survey::factory()->create([
        'created_by' => $user->id,
        'created_with_ai' => true,
    ]);

    $manualSurvey->forceFill(['created_at' => now()->subHours(2)])->save();
    $aiSurvey->forceFill(['created_at' => now()->subHour()])->save();

    $this
        ->actingAs($user)
        ->get(route('surveys.responses.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/question/ResponsesIndex')
            ->has('surveys.data', 2)
            ->where('surveys.data.0.created_with_ai', true)
            ->where('surveys.data.1.created_with_ai', false)
        );
});

test('responses dashboard exposes ai creation flag', function (): void {
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

    $this
        ->actingAs($user)
        ->get(route('surveys.responses', $survey))
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/question/Responses')
            ->where('survey.id', $survey->id)
            ->where('survey.created_with_ai', true)
        );
});
