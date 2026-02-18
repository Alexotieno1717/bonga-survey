<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContactGroupMap>
 */
class ContactGroupMapFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'contact_id' => Contact::factory(),
            'contact_group_id' => ContactGroup::factory(),
            'group' => $this->faker->word(),
            'phone' => '2547'.$this->faker->numberBetween(10000000, 99999999),
            'status' => 'active',
        ];
    }
}
