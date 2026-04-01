<?php

use App\Models\Contact;
use App\Models\Survey;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function (): void {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard shows survey metrics and chart data', function (): void {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'user_id' => $user->id,
    ]);

    $draftSurvey = Survey::query()->create([
        'name' => 'Draft Survey',
        'description' => 'Draft survey description',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
        'trigger_word' => 'DRAFT-SURVEY',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'draft',
        'created_with_ai' => false,
        'created_by' => $user->id,
    ]);

    $activeSurvey = Survey::query()->create([
        'name' => 'Active Survey',
        'description' => 'Active survey description',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(10)->toDateString(),
        'trigger_word' => 'ACTIVE-SURVEY',
        'completion_message' => null,
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->addDay(),
        'status' => 'active',
        'created_with_ai' => true,
        'created_by' => $user->id,
    ]);

    $completedSurvey = Survey::query()->create([
        'name' => 'Completed Survey',
        'description' => 'Completed survey description',
        'start_date' => now()->subDays(10)->toDateString(),
        'end_date' => now()->subDay()->toDateString(),
        'trigger_word' => 'COMPLETED-SURVEY',
        'completion_message' => 'Thank you',
        'invitation_message' => 'Reply START',
        'scheduled_time' => now()->subDays(2),
        'status' => 'completed',
        'created_with_ai' => false,
        'created_by' => $user->id,
    ]);

    $draftSurvey->forceFill(['created_at' => now()->subHours(3)])->save();
    $completedSurvey->forceFill(['created_at' => now()->subHours(2)])->save();
    $activeSurvey->forceFill(['created_at' => now()->subHour()])->save();

    $draftSurvey->contacts()->attach($contact->id, [
        'sent_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('dashboard')
            ->where('surveyStats.total', 3)
            ->where('surveyStats.draft', 1)
            ->where('surveyStats.active', 1)
            ->where('surveyStats.completed', 1)
            ->where('surveyCreationStats.ai', 1)
            ->where('surveyCreationStats.manual', 2)
            ->has('statusChart', 3)
            ->has('recentSurveys', 3)
            ->where('recentSurveys.0.created_with_ai', true)
        );

    expect($activeSurvey->exists)->toBeTrue();
    expect($completedSurvey->exists)->toBeTrue();
});

test('dashboard exposes local sms outbox when log driver is enabled', function (): void {
    config()->set('services.sms.driver', 'log');

    $logPath = storage_path('logs/laravel.log');
    file_put_contents($logPath, '');

    $logLine = '[2026-03-10 11:20:00] local.INFO: SMS message logged locally. {"phone":"254700000000","message":"Outbox test message"}';
    file_put_contents($logPath, $logLine.PHP_EOL, FILE_APPEND);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('dashboard')
            ->where('smsDriver', 'log')
            ->has('smsOutbox', 1)
            ->where('smsOutbox.0.phone', '254700000000')
            ->where('smsOutbox.0.message', 'Outbox test message')
        );
});
