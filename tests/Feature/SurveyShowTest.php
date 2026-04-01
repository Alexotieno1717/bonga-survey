<?php

use App\Models\Question;
use App\Models\Survey;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('survey details expose ai creation flag', function (): void {
    $user = User::factory()->create();
    $survey = Survey::factory()->create([
        'created_by' => $user->id,
        'created_with_ai' => true,
        'status' => 'draft',
    ]);

    Question::factory()->create([
        'survey_id' => $survey->id,
        'response_type' => 'free-text',
    ]);

    $response = $this->actingAs($user)->get(route('surveys.show', $survey));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/question/Show')
            ->where('survey.id', $survey->id)
            ->where('survey.created_with_ai', true)
        );
});
