<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Survey\HandleIncomingSurveyMessage;
use Illuminate\Console\Command;

class SmsTestSequenceCommand extends Command
{
    protected $signature = 'sms:test-sequence {phone : Recipient phone number} {messages* : Messages to send in order}';

    protected $description = 'Simulate a full inbound SMS conversation in a single command.';

    public function __construct(
        private readonly HandleIncomingSurveyMessage $handleIncomingSurveyMessage,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $phone = (string) $this->argument('phone');
        $messages = $this->argument('messages');

        if (! is_array($messages) || $messages === []) {
            $this->error('Provide at least one message.');

            return self::FAILURE;
        }

        $hasFailure = false;

        foreach (array_values($messages) as $index => $message) {
            $messageText = (string) $message;

            $payload = [
                'MSISDN' => $phone,
                'txtMessage' => $messageText,
            ];

            $result = $this->handleIncomingSurveyMessage->handle($phone, $messageText, $payload);

            $processed = (bool) ($result['processed'] ?? false);
            $status = (string) ($result['status'] ?? 'unknown');
            $statusMessage = (string) ($result['message'] ?? '');

            $this->line(sprintf('Step %d: "%s"', $index + 1, $messageText));
            $this->line($processed ? 'processed: true' : 'processed: false');
            $this->line("status: {$status}");

            if ($statusMessage !== '') {
                $this->line("message: {$statusMessage}");
            }

            if (! $processed) {
                $hasFailure = true;
            }
        }

        return $hasFailure ? self::FAILURE : self::SUCCESS;
    }
}
