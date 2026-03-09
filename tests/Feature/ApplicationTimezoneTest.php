<?php

test('application uses nairobi timezone', function (): void {
    expect(config('app.timezone'))->toBe('Africa/Nairobi');
    expect(now()->getTimezone()->getName())->toBe('Africa/Nairobi');
});
