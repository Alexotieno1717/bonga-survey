<?php

declare(strict_types=1);

namespace App\Http\Requests\Survey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSurveyQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:1000'],
            'response_type' => ['required', Rule::in(['free-text', 'multiple-choice'])],
            'free_text_description' => ['nullable', 'string'],
            'allow_multiple' => ['sometimes', 'boolean'],
            'options' => ['nullable', 'array'],
            'options.*.option' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $responseType = (string) $this->input('response_type');
            $options = collect((array) $this->input('options'))
                ->pluck('option')
                ->map(fn (mixed $value): string => trim((string) $value))
                ->filter()
                ->values();

            if ($responseType === 'multiple-choice' && $options->isEmpty()) {
                $validator->errors()->add('options', 'At least one option is required for multiple choice questions.');
            }
        });
    }
}
