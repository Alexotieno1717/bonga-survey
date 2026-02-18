<?php

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\ContactGroupMap;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory(3)->create()->each(function ($user) {

            $groups = ContactGroup::factory(5)->create([
                'user_id' => $user->id,
            ]);

            $contacts = Contact::factory(20)->create([
                'user_id' => $user->id,
            ]);

            foreach ($contacts as $contact) {
                $group = $groups->random();

                ContactGroupMap::factory()->create([
                    'user_id' => $user->id,
                    'contact_id' => $contact->id,
                    'contact_group_id' => $group->id,
                    'group' => $group->name,
                    'phone' => $contact->phone,
                ]);
            }
        });
    }
}
