<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Survey>
 */
class SurveyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'trigger_word' => $this->faker->unique()->lexify('TRIGGER????'),
            'completion_message' => $this->faker->optional()->sentence(),
            'invitation_message' => 'Reply START',
            'scheduled_time' => now()->addHour(),
            'status' => 'draft',
            'created_by' => User::factory(),
        ];
    }
}
