<?php

declare(strict_types=1);

namespace App\Http\Requests\Survey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ApplyAiSurveyDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'survey_name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question' => ['required', 'string', 'max:500'],
            'questions.*.response_type' => ['required', Rule::in(['free-text', 'multiple-choice'])],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['required_if:questions.*.response_type,multiple-choice', 'string', 'max:255'],
            'questions.*.allow_multiple' => ['nullable', 'boolean'],
            'questions.*.branching' => ['nullable'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $questions = $this->input('questions', []);

            if (! is_array($questions)) {
                return;
            }

            foreach ($questions as $index => $question) {
                if (! is_array($question)) {
                    continue;
                }

                $responseType = $question['response_type'] ?? null;
                if ($responseType === 'multiple-choice') {
                    $allowMultiple = filter_var($question['allow_multiple'] ?? false, FILTER_VALIDATE_BOOL);
                    $options = $question['options'] ?? [];
                    if (! is_array($options)) {
                        $validator->errors()->add("questions.$index.options", 'Multiple choice questions need options.');

                        continue;
                    }

                    $normalizedOptions = collect($options)
                        ->map(fn ($option) => is_scalar($option) ? trim((string) $option) : '')
                        ->filter()
                        ->values();

                    if ($normalizedOptions->count() < 2) {
                        $validator->errors()->add("questions.$index.options", 'Add at least two options.');
                    }

                    if ($allowMultiple) {
                        if (array_key_exists('branching', $question) && is_array($question['branching'])) {
                            $validator->errors()->add("questions.$index.branching", 'Branching must be a single value when multiple selection is enabled.');
                        }

                        continue;
                    }

                    if (array_key_exists('branching', $question) && ! is_array($question['branching'])) {
                        $validator->errors()->add("questions.$index.branching", 'Branching must be a list for multiple choice questions.');
                    }

                    continue;
                }

                if (array_key_exists('branching', $question) && is_array($question['branching'])) {
                    $validator->errors()->add("questions.$index.branching", 'Branching must be a single value for free text questions.');
                }
            }
        });
    }
}
