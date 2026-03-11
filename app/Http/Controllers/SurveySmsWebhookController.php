<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\HandleIncomingSurveyMessage;
use App\Http\Requests\Survey\HandleInboundSmsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SurveySmsWebhookController extends Controller
{
    public function __construct(
        private readonly HandleIncomingSurveyMessage $handleIncomingSurveyMessage,
    ) {}

    public function __invoke(HandleInboundSmsRequest $request): JsonResponse
    {
        $payload = $request->all();
        $phoneNumber = $this->extractPayloadValue($payload, [
            'MSISDN',
            'msisdn',
            'phone',
            'from',
            'mobile',
            'source_addr',
            'originator',
            'sender',
        ]);
        $message = $this->extractPayloadValue($payload, [
            'txtMessage',
            'txtmessage',
            'message',
            'text',
            'body',
            'content',
            'sms',
        ]);
        $result = $this->handleIncomingSurveyMessage->handle($phoneNumber, $message, $payload);

        Log::info('Inbound SMS webhook processed.', [
            'phone' => $phoneNumber,
            'message_length' => mb_strlen($message),
            'status' => $result['status'] ?? 'unknown',
            'processed' => $result['processed'] ?? false,
            'payload_keys' => array_keys($payload),
        ]);

        return response()->json($result);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function extractPayloadValue(array $payload, array $keys): string
    {
        $normalizedPayload = [];
        foreach ($payload as $key => $value) {
            $normalizedPayload[mb_strtolower((string) $key)] = $value;
        }

        foreach ($keys as $key) {
            $normalizedKey = mb_strtolower($key);

            if (! array_key_exists($normalizedKey, $normalizedPayload)) {
                continue;
            }

            $value = $normalizedPayload[$normalizedKey];
            if (is_scalar($value)) {
                return trim((string) $value);
            }
        }

        return '';
    }
}
