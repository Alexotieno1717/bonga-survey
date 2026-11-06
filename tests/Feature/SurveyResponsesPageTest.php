<?php

declare(strict_types=1);

use App\Models\Survey;
use App\Models\User;

it('renders the survey responses dashboard', function (): void {
    $user = User::factory()->create();
    $survey = Survey::factory()->create([
        'created_by' => $user->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)->get(route('surveys.responses', $survey));

    $response->assertOk();
    $response->assertSee('Responses');
    $response->assertSee($survey->name);
});
