<?php

declare(strict_types=1);

namespace App\Actions\Survey;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendSmsMessage
{
    /**
     * @return array{
     *     successful: bool,
     *     status: int|null,
     *     status_message: string,
     *     unique_id: string|null
     * }
     */
    public function handle(string $phoneNumber, string $message): array
    {
        $apiUrl = (string) config('services.sms.url', '');
        $apiClientId = (string) config('services.sms.client_id', '');
        $apiKey = (string) config('services.sms.key', '');
        $apiSecret = (string) config('services.sms.secret', '');
        $serviceId = (string) config('services.sms.service_id', '1');
        $timeout = (int) config('services.sms.timeout', 15);
        $retryAttempts = max(1, (int) config('services.sms.retry_attempts', 3));
        $retryBaseDelayMs = max(0, (int) config('services.sms.retry_base_delay_ms', 300));

        if (
            $apiUrl === '' ||
            $apiClientId === '' ||
            $apiKey === '' ||
            $apiSecret === ''
        ) {
            return [
                'successful' => false,
                'status' => null,
                'status_message' => 'SMS gateway credentials are not configured.',
                'unique_id' => null,
            ];
        }

        for ($attempt = 1; $attempt <= $retryAttempts; $attempt++) {
            try {
                $response = Http::timeout($timeout)
                    ->asMultipart()
                    ->post($apiUrl, [
                        ['name' => 'apiClientID', 'contents' => $apiClientId],
                        ['name' => 'key', 'contents' => $apiKey],
                        ['name' => 'secret', 'contents' => $apiSecret],
                        ['name' => 'txtMessage', 'contents' => $message],
                        ['name' => 'MSISDN', 'contents' => $phoneNumber],
                        ['name' => 'serviceID', 'contents' => $serviceId],
                    ]);
            } catch (ConnectionException $exception) {
                if ($attempt < $retryAttempts) {
                    $this->pauseBeforeRetry($attempt, $retryBaseDelayMs);

                    continue;
                }

                Log::warning('SMS gateway request failed due to connectivity issues.', [
                    'phone' => $phoneNumber,
                    'error' => $exception->getMessage(),
                    'attempts' => $attempt,
                ]);

                return [
                    'successful' => false,
                    'status' => null,
                    'status_message' => 'Could not connect to SMS gateway.',
                    'unique_id' => null,
                ];
            }

            if (! $response->ok()) {
                if ($response->serverError() && $attempt < $retryAttempts) {
                    $this->pauseBeforeRetry($attempt, $retryBaseDelayMs);

                    continue;
                }

                return [
                    'successful' => false,
                    'status' => null,
                    'status_message' => 'SMS gateway returned a non-success HTTP response.',
                    'unique_id' => null,
                ];
            }

            $status = is_numeric($response->json('status'))
                ? (int) $response->json('status')
                : null;
            $statusMessage = (string) $response->json('status_message', '');
            $uniqueId = $response->json('unique_id');

            return [
                'successful' => $status === 222,
                'status' => $status,
                'status_message' => $statusMessage,
                'unique_id' => is_string($uniqueId) ? $uniqueId : null,
            ];
        }

        return [
            'successful' => false,
            'status' => null,
            'status_message' => 'SMS gateway request retries exhausted.',
            'unique_id' => null,
        ];
    }

    private function pauseBeforeRetry(int $attempt, int $retryBaseDelayMs): void
    {
        if ($retryBaseDelayMs === 0) {
            return;
        }

        $delayMilliseconds = $retryBaseDelayMs * (2 ** ($attempt - 1));
        usleep($delayMilliseconds * 1000);
    }
}
