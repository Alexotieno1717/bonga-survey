<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SurveyResponse>
 */
class SurveyResponseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory();

        return [
            'survey_id' => Survey::factory()->state([
                'created_by' => $user,
            ]),
            'contact_id' => Contact::factory()->state([
                'user_id' => $user,
            ]),
            'started_at' => now(),
            'completed_at' => null,
        ];
    }
}
