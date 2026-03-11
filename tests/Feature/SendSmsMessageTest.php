<?php

use App\Actions\Survey\SendSmsMessage;
use Illuminate\Support\Facades\Log;

test('log driver records sms and reports success', function (): void {
    config()->set('services.sms.driver', 'log');

    Log::spy();

    $result = app(SendSmsMessage::class)->handle('254700000000', 'Hello from local driver.');

    expect($result['successful'])->toBeTrue();
    expect($result['status'])->toBe(222);

    Log::shouldHaveReceived('info')
        ->once()
        ->withArgs(function (string $message, array $context): bool {
            return $message === 'SMS message logged locally.'
                && $context['phone'] === '254700000000'
                && $context['message'] === 'Hello from local driver.';
        });
});
