<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SurveyMessage>
 */
class SurveyMessageFactory extends Factory
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
            'direction' => $this->faker->randomElement(['inbound', 'outbound']),
            'phone' => $this->faker->e164PhoneNumber(),
            'delivery_status' => $this->faker->randomElement(['queued', 'sent', 'failed', 'received']),
            'provider_message_id' => $this->faker->optional()->uuid(),
            'resolved_option_text' => $this->faker->optional()->word(),
            'message' => $this->faker->sentence(),
            'payload' => $this->faker->optional()->passthrough([
                'MSISDN' => $this->faker->e164PhoneNumber(),
                'txtMessage' => $this->faker->sentence(),
            ]),
        ];
    }
}
