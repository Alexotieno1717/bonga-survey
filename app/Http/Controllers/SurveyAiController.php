<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\GenerateAiSurveyDraft;
use App\Http\Requests\Survey\ApplyAiSurveyDraftRequest;
use App\Http\Requests\Survey\GenerateSurveyAiRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SurveyAiController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('surveys/ai/Index', [
            'input' => session('ai_input'),
            'draft' => session('ai_draft'),
        ]);
    }

    public function generate(GenerateSurveyAiRequest $request, GenerateAiSurveyDraft $generator): RedirectResponse|Response
    {
        $validated = $request->validated();
        $surveyName = $validated['survey_name'] ?? null;
        $description = $validated['description'];

        try {
            $draft = $generator->handle(
                description: $description,
                surveyName: $surveyName,
            );
        } catch (RuntimeException $exception) {
            return back()
                ->withErrors(['description' => $exception->getMessage()])
                ->withInput();
        }

        return redirect()
            ->route('surveys.ai.index')
            ->with('ai_input', [
                'survey_name' => $surveyName,
                'description' => $description,
            ])
            ->with('ai_draft', $draft);
    }

    public function apply(ApplyAiSurveyDraftRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $questions = collect($validated['questions'])
            ->map(function (array $question): array {
                $responseType = $question['response_type'];
                $allowMultiple = filter_var($question['allow_multiple'] ?? false, FILTER_VALIDATE_BOOL);
                $options = collect($question['options'] ?? [])
                    ->map(fn (string $option): string => trim($option))
                    ->filter()
                    ->values()
                    ->all();
                $branching = $question['branching'] ?? null;

                return [
                    'question' => (string) $question['question'],
                    'response_type' => $responseType,
                    'allow_multiple' => $responseType === 'multiple-choice' ? $allowMultiple : false,
                    'options' => $responseType === 'multiple-choice' ? $options : [],
                    'branching' => $responseType === 'multiple-choice'
                        ? ($allowMultiple
                            ? (string) (is_scalar($branching) ? $branching : '0')
                            : collect($options)
                                ->keys()
                                ->map(function (int $index) use ($branching): string {
                                    if (! is_array($branching)) {
                                        return '0';
                                    }

                                    $value = $branching[$index] ?? '0';

                                    return is_scalar($value) ? (string) $value : '0';
                                })
                                ->all())
                        : (string) (is_scalar($branching) ? $branching : '0'),
                ];
            })
            ->values()
            ->all();

        return redirect()
            ->route('questions.create')
            ->with('ai_survey_builder_draft', [
                'survey_name' => (string) $validated['survey_name'],
                'description' => (string) $validated['description'],
                'questions' => $questions,
            ]);
    }
}
