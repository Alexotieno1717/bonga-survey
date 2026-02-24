<?php

declare(strict_types=1);

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

test('authenticated user can create a contact', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $group = ContactGroup::factory()->create([
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('contact.store'), [
            'names' => 'John Doe',
            'phone' => '0700111222',
            'email' => 'john@example.com',
            'gender' => 'male',
            'contact_group_id' => $group->id,
        ]);

    $response->assertRedirect(route('contact.index'));
    $this->assertDatabaseHas('contacts', [
        'user_id' => $user->id,
        'names' => 'John Doe',
        'phone' => '0700111222',
        'email' => 'john@example.com',
        'gender' => 'male',
        'contact_group_id' => $group->id,
    ]);
});

test('authenticated user can update own contact', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $group = ContactGroup::factory()->create([
        'user_id' => $user->id,
    ]);

    $contact = Contact::factory()->create([
        'user_id' => $user->id,
        'names' => 'Old Name',
        'contact_group_id' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('contact.update', $contact), [
            'names' => 'Updated Name',
            'phone' => (string) $contact->phone,
            'email' => 'updated@example.com',
            'gender' => 'female',
            'contact_group_id' => $group->id,
        ]);

    $response->assertRedirect(route('contact.index'));
    $this->assertDatabaseHas('contacts', [
        'id' => $contact->id,
        'names' => 'Updated Name',
        'email' => 'updated@example.com',
        'gender' => 'female',
        'contact_group_id' => $group->id,
    ]);
});

test('authenticated user can delete own contact', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('contact.destroy', $contact));

    $response->assertRedirect(route('contact.index'));
    $this->assertDatabaseMissing('contacts', [
        'id' => $contact->id,
    ]);
});

test('user cannot edit another users contact', function (): void {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $anotherUser = User::factory()->create();
    $foreignContact = Contact::factory()->create([
        'user_id' => $anotherUser->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('contact.update', $foreignContact), [
            'names' => 'Should Fail',
            'phone' => (string) $foreignContact->phone,
            'email' => $foreignContact->email,
            'gender' => $foreignContact->gender,
            'contact_group_id' => null,
        ]);

    $response->assertForbidden();
});
