<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\SurveyResponse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SurveyResponseAnswer>
 */
class SurveyResponseAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'survey_response_id' => SurveyResponse::factory(),
            'question_id' => Question::factory(),
            'option_id' => null,
            'answer_text' => $this->faker->sentence(),
        ];
    }
}
