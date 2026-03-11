<?php

namespace Database\Factories;

use App\Models\Survey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
class QuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'survey_id' => Survey::factory(),
            'question' => $this->faker->sentence(),
            'response_type' => $this->faker->randomElement(['free-text', 'multiple-choice']),
            'free_text_description' => null,
            'allow_multiple' => false,
            'order' => $this->faker->numberBetween(0, 5),
            'branching' => null,
        ];
    }
}
