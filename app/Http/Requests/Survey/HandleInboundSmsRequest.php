<?php

declare(strict_types=1);

namespace App\Http\Requests\Survey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class HandleInboundSmsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'MSISDN' => ['nullable', 'string', 'max:50'],
            'msisdn' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'from' => ['nullable', 'string', 'max:50'],
            'txtMessage' => ['nullable', 'string', 'max:5000'],
            'txtmessage' => ['nullable', 'string', 'max:5000'],
            'message' => ['nullable', 'string', 'max:5000'],
            'text' => ['nullable', 'string', 'max:5000'],
            'body' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $phoneNumber = $this->extractPayloadValue([
                'MSISDN',
                'msisdn',
                'phone',
                'from',
                'mobile',
                'source_addr',
                'originator',
                'sender',
            ]);
            $message = $this->extractPayloadValue([
                'txtMessage',
                'txtmessage',
                'message',
                'text',
                'body',
                'content',
                'sms',
            ]);

            if ($phoneNumber === '') {
                $validator->errors()->add('MSISDN', 'A phone number is required.');
            }

            if ($message === '') {
                $validator->errors()->add('txtMessage', 'A message body is required.');
            }
        });
    }

    /**
     * @param  array<int, string>  $keys
     */
    private function extractPayloadValue(array $keys): string
    {
        $payload = $this->all();
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
