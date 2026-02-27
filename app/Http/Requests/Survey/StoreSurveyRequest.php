<?php

declare(strict_types=1);

namespace App\Http\Requests\Survey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSurveyRequest extends FormRequest
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
        $status = (string) $this->input('status', 'draft');
        $isPublishing = $status === 'active';

        return [
            'status' => ['nullable', Rule::in(['draft', 'active'])],
            'surveyName' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after:startDate'],
            'triggerWord' => ['required', 'string', 'max:50', 'unique:surveys,trigger_word'],
            'completionMessage' => ['nullable', 'string'],
            'invitationMessage' => [$isPublishing ? 'required' : 'nullable', 'string'],
            'scheduleTime' => [$isPublishing ? 'required' : 'nullable', 'date'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question' => ['required', 'string'],
            'questions.*.responseType' => ['required', Rule::in(['free-text', 'multiple-choice'])],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['required_if:questions.*.responseType,multiple-choice', 'string'],
            'questions.*.allowMultiple' => ['boolean'],
            'questions.*.freeTextDescription' => ['nullable', 'string'],
            'questions.*.branching' => ['nullable'],
            'recipients' => [$isPublishing ? 'required' : 'nullable', 'array'],
            'recipients.*.id' => [
                $isPublishing ? 'required' : 'nullable',
                Rule::exists('contacts', 'id')->where(function ($query): void {
                    $query->where('user_id', $this->user()->id);
                }),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipients.*.id.exists' => 'Each selected recipient must belong to your account.',
        ];
    }
}
