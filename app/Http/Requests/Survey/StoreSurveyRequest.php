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
            'createdWithAi' => ['nullable', 'boolean'],
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
            'questions.*.childQuestionStates' => ['nullable', 'array'],
            'questions.*.childQuestionStates.*.followUpBranching' => ['nullable'],
            'questions.*.childQuestionStates.*.childQuestions' => ['nullable', 'array'],
            'questions.*.childQuestionStates.*.childQuestions.*.question' => ['nullable', 'string'],
            'questions.*.childQuestionStates.*.childQuestions.*.responseType' => ['nullable', Rule::in(['free-text', 'multiple-choice'])],
            'questions.*.childQuestionStates.*.childQuestions.*.branching' => ['nullable'],
            'questions.*.childQuestionStates.*.childQuestions.*.options' => ['nullable', 'array'],
            'questions.*.childQuestionStates.*.childQuestions.*.optionBranching' => ['nullable', 'array'],
            'questions.*.childQuestionStates.*.childQuestions.*.allowMultiple' => ['nullable', 'boolean'],
            'questions.*.childQuestionStates.*.childQuestions.*.isSaved' => ['nullable', 'boolean'],
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
