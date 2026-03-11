<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Survey\HandleIncomingSurveyMessage;
use Illuminate\Console\Command;

class SmsTestInboundCommand extends Command
{
    protected $signature = 'sms:test {phone : Recipient phone number} {message : SMS message body}';

    protected $description = 'Simulate an inbound SMS message without using curl.';

    public function __construct(
        private readonly HandleIncomingSurveyMessage $handleIncomingSurveyMessage,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $phone = (string) $this->argument('phone');
        $message = (string) $this->argument('message');

        $payload = [
            'MSISDN' => $phone,
            'txtMessage' => $message,
        ];

        $result = $this->handleIncomingSurveyMessage->handle($phone, $message, $payload);

        $processed = (bool) ($result['processed'] ?? false);
        $status = (string) ($result['status'] ?? 'unknown');
        $statusMessage = (string) ($result['message'] ?? '');

        $this->line($processed ? 'processed: true' : 'processed: false');
        $this->line("status: {$status}");
        $this->line("message: {$statusMessage}");

        return $processed ? self::SUCCESS : self::FAILURE;
    }
}
