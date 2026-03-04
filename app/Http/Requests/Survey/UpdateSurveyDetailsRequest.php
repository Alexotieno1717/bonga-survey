<?php

declare(strict_types=1);

namespace App\Http\Requests\Survey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSurveyDetailsRequest extends FormRequest
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
        $survey = $this->route('survey');
        $surveyId = $survey?->id;

        return [
            'surveyName' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after:startDate'],
            'triggerWord' => [
                'required',
                'string',
                'max:50',
                Rule::unique('surveys', 'trigger_word')->ignore($surveyId),
            ],
            'invitationMessage' => ['nullable', 'string'],
            'completionMessage' => ['nullable', 'string'],
            'scheduleTime' => ['nullable', 'date'],
        ];
    }
}
