<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\HandleIncomingSurveyMessage;
use App\Http\Requests\Survey\HandleInboundSmsRequest;
use Illuminate\Http\JsonResponse;

class SurveySmsWebhookController extends Controller
{
    public function __construct(
        private readonly HandleIncomingSurveyMessage $handleIncomingSurveyMessage,
    ) {}

    public function __invoke(HandleInboundSmsRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $phoneNumber = $this->extractPayloadValue($payload, ['MSISDN', 'msisdn', 'phone', 'from']);
        $message = $this->extractPayloadValue($payload, ['txtMessage', 'txtmessage', 'message', 'text', 'body']);
        $result = $this->handleIncomingSurveyMessage->handle($phoneNumber, $message);

        return response()->json($result);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function extractPayloadValue(array $payload, array $keys): string
    {
        foreach ($keys as $key) {
            if (! array_key_exists($key, $payload)) {
                continue;
            }

            $value = $payload[$key];
            if (is_scalar($value)) {
                return trim((string) $value);
            }
        }

        return '';
    }
}
