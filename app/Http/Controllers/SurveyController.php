<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\CreateSurvey;
use App\Http\Requests\Survey\StoreSurveyRequest;
use App\Http\Requests\Survey\UpdateSurveyDetailsRequest;
use App\Http\Requests\Survey\UpdateSurveyQuestionRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Question;
use App\Models\Survey;
use App\Models\SurveyMessage;
use App\Models\SurveyResponse;
use App\Models\SurveyResponseAnswer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SurveyController extends Controller
{
    public function __construct(private readonly CreateSurvey $createSurvey) {}

    public function index(): Response
    {
        $surveys = Survey::query()
            ->where('created_by', Auth::id())
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('surveys/question/Index', [
            'surveys' => $surveys,
        ]);
    }

    public function create(): Response
    {
        $contacts = Contact::query()
            ->where('user_id', Auth::id())
            ->with('group')
            ->get()
            ->map(fn ($contact) => [
                'id' => $contact->id,
                'names' => $contact->names,
                'phone' => $contact->phone,
                'email' => $contact->email,
                'gender' => $contact->gender,
                'contact_group' => $contact->group ? [
                    'id' => $contact->group->id,
                    'name' => $contact->group->name,
                ] : null,
            ]);

        $contactGroups = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        $existingTriggerWords = Survey::query()
            ->pluck('trigger_word')
            ->map(fn (string $triggerWord): string => mb_strtolower(trim($triggerWord)))
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('surveys/question/Create', [
            'contacts' => $contacts,
            'contactGroups' => $contactGroups,
            'existingTriggerWords' => $existingTriggerWords,
            'aiDraft' => session()->pull('ai_survey_builder_draft'),
        ]);
    }

    public function store(StoreSurveyRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $survey = $this->createSurvey->handle($validated, (int) $request->user()->id);

        $requestedStatus = (string) ($validated['status'] ?? 'draft');
        $message = 'Survey saved as draft successfully!';

        if ($requestedStatus === 'active') {
            $message = $survey->status === 'active'
                ? 'Survey published successfully!'
                : 'Survey scheduled successfully. It will become active on the start date.';
        }

        return redirect()->route('questions.index')
            ->with('success', $message);
    }

    public function show(Survey $survey): Response
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->with('questions.options')
            ->withCount([
                'contacts as sent_recipients_count' => function (Builder $query): void {
                    $query->whereNotNull('contact_survey.sent_at');
                },
            ])
            ->firstOrFail();

        return Inertia::render('surveys/question/Show', [
            'survey' => $survey,
        ]);
    }

    public function updateDetails(
        UpdateSurveyDetailsRequest $request,
        Survey $survey,
    ): RedirectResponse {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        if ($survey->status !== 'draft') {
            abort(403, 'Only draft surveys can be edited.');
        }

        $validated = $request->validated();

        $survey->update([
            'name' => (string) $validated['surveyName'],
            'description' => (string) $validated['description'],
            'start_date' => (string) $validated['startDate'],
            'end_date' => (string) $validated['endDate'],
            'trigger_word' => (string) $validated['triggerWord'],
            'invitation_message' => isset($validated['invitationMessage'])
                ? (string) $validated['invitationMessage']
                : null,
            'completion_message' => isset($validated['completionMessage'])
                ? (string) $validated['completionMessage']
                : null,
            'scheduled_time' => isset($validated['scheduleTime']) && $validated['scheduleTime'] !== ''
                ? (string) $validated['scheduleTime']
                : null,
        ]);

        return redirect()
            ->route('surveys.show', $survey)
            ->with('success', 'Survey details updated successfully.');
    }

    public function storeQuestion(
        UpdateSurveyQuestionRequest $request,
        Survey $survey,
    ): RedirectResponse {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        if ($survey->status !== 'draft') {
            abort(403, 'Only draft surveys can be edited.');
        }

        $validated = $request->validated();
        $responseType = (string) $validated['response_type'];
        $branchingTarget = $validated['branching'] ?? null;
        $normalizedBranching = null;

        if ($branchingTarget !== null && $branchingTarget !== '') {
            if (is_array($branchingTarget)) {
                $normalizedBranching = $branchingTarget;
            } elseif (is_numeric($branchingTarget)) {
                $normalizedBranching = ['next_question' => (int) $branchingTarget];
            }
        }

        $nextOrder = ((int) ($survey->questions()->max('order') ?? -1)) + 1;

        $question = $survey->questions()->create([
            'question' => (string) $validated['question'],
            'response_type' => $responseType,
            'allow_multiple' => $responseType === 'multiple-choice' && (bool) ($validated['allow_multiple'] ?? false),
            'free_text_description' => $responseType === 'free-text'
                ? (string) ($validated['free_text_description'] ?? '')
                : null,
            'order' => $nextOrder,
            'branching' => $normalizedBranching,
        ]);

        if ($responseType === 'multiple-choice') {
            $options = collect((array) ($validated['options'] ?? []))
                ->pluck('option')
                ->map(fn (mixed $value): string => trim((string) $value))
                ->filter()
                ->values();

            foreach ($options as $index => $optionText) {
                $question->options()->create([
                    'option' => $optionText,
                    'order' => $index,
                    'branching' => null,
                ]);
            }
        }

        return redirect()
            ->route('surveys.show', $survey)
            ->with('success', 'Question added successfully.');
    }

    public function updateQuestion(
        UpdateSurveyQuestionRequest $request,
        Survey $survey,
        Question $question,
    ): RedirectResponse {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $question = $survey->questions()
            ->whereKey($question->id)
            ->firstOrFail();

        if ($survey->status !== 'draft') {
            abort(403, 'Only draft surveys can be edited.');
        }

        $validated = $request->validated();
        $responseType = (string) $validated['response_type'];

        $question->update([
            'question' => (string) $validated['question'],
            'response_type' => $responseType,
            'allow_multiple' => $responseType === 'multiple-choice' && (bool) ($validated['allow_multiple'] ?? false),
            'free_text_description' => $responseType === 'free-text'
                ? (string) ($validated['free_text_description'] ?? '')
                : null,
        ]);

        $question->options()->delete();

        if ($responseType === 'multiple-choice') {
            $options = collect((array) ($validated['options'] ?? []))
                ->pluck('option')
                ->map(fn (mixed $value): string => trim((string) $value))
                ->filter()
                ->values();

            foreach ($options as $index => $optionText) {
                $question->options()->create([
                    'option' => $optionText,
                    'order' => $index,
                    'branching' => null,
                ]);
            }
        }

        return redirect()
            ->route('surveys.show', $survey)
            ->with('success', 'Question updated successfully.');
    }

    public function destroy(Survey $survey): RedirectResponse
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $survey->delete();

        return redirect()
            ->route('questions.index')
            ->with('success', 'Survey deleted successfully.');
    }

    public function cancel(Survey $survey): RedirectResponse
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        if (in_array($survey->status, ['completed', 'cancelled'], true)) {
            return redirect()
                ->route('surveys.show', $survey)
                ->with('error', 'This survey cannot be cancelled.');
        }

        $survey->update([
            'status' => 'cancelled',
        ]);

        return redirect()
            ->route('surveys.show', $survey)
            ->with('success', 'Survey cancelled successfully.');
    }

    public function reactivate(Survey $survey): RedirectResponse
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        if ($survey->status !== 'cancelled') {
            return redirect()
                ->route('surveys.show', $survey)
                ->with('error', 'Only cancelled surveys can be reactivated.');
        }

        $hasPublishedRecipients = $survey->contacts()
            ->whereNotNull('contact_survey.sent_at')
            ->exists();

        if (! $hasPublishedRecipients) {
            $status = 'draft';
        } else {
            $today = now()->toDateString();
            $startDate = $survey->start_date?->toDateString();
            $endDate = $survey->end_date?->toDateString();

            if ($startDate !== null && $today < $startDate) {
                $status = 'draft';
            } elseif ($endDate !== null && $today > $endDate) {
                $status = 'completed';
            } else {
                $status = 'active';
            }
        }

        $survey->update([
            'status' => $status,
        ]);

        return redirect()
            ->route('surveys.show', $survey)
            ->with('success', 'Survey reactivated successfully.');
    }

    public function responsesIndex(): Response
    {
        $surveys = Survey::query()
            ->where('created_by', Auth::id())
            ->withCount([
                'questions',
                'contacts',
                'contacts as sent_recipients_count' => function (Builder $query): void {
                    $query->whereNotNull('contact_survey.sent_at');
                },
            ])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('surveys/question/ResponsesIndex', [
            'surveys' => $surveys,
        ]);
    }

    public function responses(Request $request, Survey $survey): Response|StreamedResponse
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->with('questions.options')
            ->firstOrFail();

        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $dateFrom = $request->date('date_from')?->toDateString();
        $dateTo = $request->date('date_to')?->toDateString();
        $groupId = $request->integer('group_id');
        $exportFormat = (string) $request->string('export');

        if (! in_array($status, ['all', 'sent', 'pending', 'awaiting', 'in_progress', 'completed'], true)) {
            $status = 'all';
        }

        $availableGroupIds = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->pluck('id')
            ->all();

        if (! in_array($groupId, $availableGroupIds, true)) {
            $groupId = null;
        }

        $baseRecipientsQuery = (fn (): BelongsToMany => $survey->contacts()
            ->select('contacts.id', 'contacts.names', 'contacts.phone', 'contacts.email', 'contacts.contact_group_id')
            ->with('group:id,name')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $innerQuery) use ($search): void {
                    $innerQuery
                        ->where('contacts.names', 'like', "%{$search}%")
                        ->orWhere('contacts.phone', 'like', "%{$search}%")
                        ->orWhere('contacts.email', 'like', "%{$search}%");
                });
            })
            ->when($groupId !== null, function (Builder $query) use ($groupId): void {
                $query->where('contacts.contact_group_id', $groupId);
            })
            ->when($status === 'sent', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sent_at');
            })
            ->when($status === 'pending', function (Builder $query): void {
                $query->whereNull('contact_survey.sent_at');
            })
            ->when($status === 'awaiting', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sent_at')
                    ->whereNull('contact_survey.sms_flow_started_at');
            })
            ->when($status === 'in_progress', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sms_flow_started_at')
                    ->whereNull('contact_survey.sms_flow_completed_at');
            })
            ->when($status === 'completed', function (Builder $query): void {
                $query->whereNotNull('contact_survey.sms_flow_completed_at');
            })
            ->when($dateFrom !== null, function (Builder $query) use ($dateFrom): void {
                $query->whereDate('contact_survey.sent_at', '>=', $dateFrom);
            })
            ->when($dateTo !== null, function (Builder $query) use ($dateTo): void {
                $query->whereDate('contact_survey.sent_at', '<=', $dateTo);
            }));

        if (in_array($exportFormat, ['csv', 'xlsx', 'answers_csv', 'answers_xlsx'], true)) {
            $allRecipients = $baseRecipientsQuery()
                ->orderBy('contacts.names')
                ->get();

            if (str_starts_with($exportFormat, 'answers_')) {
                $format = str_replace('answers_', '', $exportFormat);

                return $this->exportAnswers($survey, $allRecipients, $format);
            }

            return $this->exportResponses($survey, $allRecipients, $exportFormat);
        }

        $totalRecipients = $baseRecipientsQuery()->count();
        $sentRecipients = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sent_at')
            ->count();
        $pendingRecipients = max(0, $totalRecipients - $sentRecipients);

        $startedCount = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sms_flow_started_at')
            ->count();
        $completedCount = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sms_flow_completed_at')
            ->count();
        $responseCount = $startedCount;
        $completionRate = $sentRecipients > 0
            ? round(($completedCount / $sentRecipients) * 100, 2)
            : 0;

        $invalidPhoneCount = $baseRecipientsQuery()
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('contacts.phone')
                    ->orWhere('contacts.phone', '')
                    ->orWhereRaw('LENGTH(REPLACE(contacts.phone, " ", "")) < 10');
            })
            ->orderBy('contacts.names')
            ->count();

        $duplicatePhoneCount = $baseRecipientsQuery()
            ->whereNotNull('contacts.phone')
            ->where('contacts.phone', '!=', '')
            ->groupBy('contacts.phone')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        $emptyResponseCount = max(0, $sentRecipients - $responseCount);

        $sentSeries = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sent_at')
            ->selectRaw('DATE(contact_survey.sent_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(contact_survey.sent_at)')
            ->orderByRaw('DATE(contact_survey.sent_at)')
            ->get()
            ->pluck('total', 'day');
        $responseSeries = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sms_flow_started_at')
            ->selectRaw('DATE(contact_survey.sms_flow_started_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(contact_survey.sms_flow_started_at)')
            ->orderByRaw('DATE(contact_survey.sms_flow_started_at)')
            ->get()
            ->pluck('total', 'day');

        $today = now()->startOfDay();
        $timeSeries = collect(range(6, 0))
            ->map(function (int $daysAgo) use ($today, $sentSeries, $responseSeries): array {
                $date = $today->copy()->subDays($daysAgo)->toDateString();

                return [
                    'date' => $date,
                    'label' => $today->copy()->subDays($daysAgo)->format('M d'),
                    'invitations_sent' => (int) ($sentSeries[$date] ?? 0),
                    'responses_received' => (int) ($responseSeries[$date] ?? 0),
                ];
            })
            ->values()
            ->all();

        $recipientIds = $baseRecipientsQuery()
            ->pluck('contacts.id')
            ->all();

        if ($recipientIds === []) {
            $answers = collect();
        } else {
            $answers = SurveyResponseAnswer::query()
                ->select('survey_response_answers.question_id', 'survey_response_answers.option_id', 'survey_response_answers.answer_text')
                ->whereHas('response', function (Builder $query) use ($survey, $recipientIds): void {
                    $query->where('survey_id', $survey->id)
                        ->whereIn('contact_id', $recipientIds);
                })
                ->get()
                ->groupBy('question_id');
        }

        $questionAnalytics = $survey->questions
            ->map(function ($question) use ($answers): array {
                $questionAnswers = $answers->get($question->id, collect());
                $totalResponses = $questionAnswers->count();
                $optionCounts = $questionAnswers
                    ->whereNotNull('option_id')
                    ->groupBy('option_id')
                    ->map(fn ($items): int => $items->count());

                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'response_type' => $question->response_type,
                    'total_responses' => $totalResponses,
                    'free_text_count' => $question->response_type === 'free-text'
                        ? $questionAnswers
                            ->filter(fn ($answer): bool => is_string($answer->answer_text) && trim($answer->answer_text) !== '')
                            ->count()
                        : null,
                    'options' => $question->options
                        ->map(fn ($option): array => [
                            'id' => $option->id,
                            'option' => $option->option,
                            'count' => (int) ($optionCounts[$option->id] ?? 0),
                        ])
                        ->all(),
                ];
            })
            ->values()
            ->all();

        $recipients = $baseRecipientsQuery()
            ->orderBy('contacts.names')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($contact) use ($survey): array {
                $sentAt = $contact->pivot?->sent_at;
                $startedAt = $contact->pivot?->sms_flow_started_at;
                $completedAt = $contact->pivot?->sms_flow_completed_at;
                $responseStatus = 'pending_send';

                if ($sentAt !== null) {
                    $responseStatus = 'awaiting_response';
                }

                if ($startedAt !== null) {
                    $responseStatus = 'in_progress';
                }

                if ($completedAt !== null) {
                    $responseStatus = 'completed';
                }

                return [
                    'id' => $contact->id,
                    'names' => $contact->names,
                    'phone' => $contact->phone,
                    'email' => $contact->email,
                    'group_name' => $contact->group?->name,
                    'sent_at' => $sentAt,
                    'timeline' => [
                        'invited_at' => $survey->created_at,
                        'sent_at' => $sentAt,
                        'delivered_at' => $sentAt,
                        'replied_at' => $startedAt,
                        'completed_at' => $completedAt,
                    ],
                    'response_status' => $responseStatus,
                ];
            });

        return Inertia::render('surveys/question/Responses', [
            'survey' => [
                'id' => $survey->id,
                'name' => $survey->name,
                'status' => $survey->status,
                'created_with_ai' => (bool) $survey->created_with_ai,
                'trigger_word' => $survey->trigger_word,
                'start_date' => $survey->start_date,
                'end_date' => $survey->end_date,
                'scheduled_time' => $survey->scheduled_time,
                'questions_count' => $survey->questions()->count(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'group_id' => $groupId,
            ],
            'stats' => [
                'total_recipients' => $totalRecipients,
                'sent_recipients' => $sentRecipients,
                'pending_recipients' => $pendingRecipients,
                'response_count' => $responseCount,
                'started_recipients' => $startedCount,
                'completed_recipients' => $completedCount,
                'completion_rate' => $completionRate,
            ],
            'funnel' => [
                'invited' => $sentRecipients,
                'started' => $startedCount,
                'completed' => $completedCount,
            ],
            'quality_metrics' => [
                'invalid_phone_count' => $invalidPhoneCount,
                'empty_response_count' => $emptyResponseCount,
                'duplicate_phone_count' => $duplicatePhoneCount,
            ],
            'time_series' => $timeSeries,
            'question_analytics' => $questionAnalytics,
            'groups' => ContactGroup::query()
                ->where('user_id', Auth::id())
                ->orderBy('name')
                ->get(['id', 'name']),
            'recipients' => $recipients,
        ]);
    }

    public function responseDetail(Survey $survey, Contact $contact): Response
    {
        $survey = Survey::query()
            ->whereKey($survey->id)
            ->where('created_by', Auth::id())
            ->with('questions.options')
            ->firstOrFail();

        $recipient = $survey->contacts()
            ->whereKey($contact->id)
            ->with('group:id,name')
            ->firstOrFail();

        $response = SurveyResponse::query()
            ->where('survey_id', $survey->id)
            ->where('contact_id', $recipient->id)
            ->with(['answers.option', 'answers.question'])
            ->first();

        $answersByQuestion = $response?->answers
            ->keyBy('question_id')
            ?? collect();

        $questions = $survey->questions
            ->values()
            ->map(function ($question, int $index) use ($answersByQuestion): array {
                $answer = $answersByQuestion->get($question->id);
                $answerText = null;

                if ($answer !== null) {
                    if ($answer->option_id !== null) {
                        $answerText = $answer->option?->option;
                    } else {
                        $answerText = $answer->answer_text;
                    }
                }

                return [
                    'id' => $question->id,
                    'label' => sprintf('Q%d', $index + 1),
                    'question' => $question->question,
                    'response_type' => $question->response_type,
                    'answer' => $answerText,
                ];
            })
            ->all();

        $messages = SurveyMessage::query()
            ->where('survey_id', $survey->id)
            ->where('contact_id', $recipient->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (SurveyMessage $message): array => [
                'id' => $message->id,
                'direction' => $message->direction,
                'phone' => $message->phone,
                'delivery_status' => $message->delivery_status,
                'provider_message_id' => $message->provider_message_id,
                'resolved_option_text' => $message->resolved_option_text,
                'message' => $message->message,
                'created_at' => $message->created_at?->toDateTimeString(),
            ])
            ->all();

        $sentAt = $recipient->pivot?->sent_at;
        $startedAt = $response?->started_at ?? $recipient->pivot?->sms_flow_started_at;
        $completedAt = $response?->completed_at ?? $recipient->pivot?->sms_flow_completed_at;
        $responseStatus = 'pending_send';

        if ($sentAt !== null) {
            $responseStatus = 'awaiting_response';
        }

        if ($startedAt !== null) {
            $responseStatus = 'in_progress';
        }

        if ($completedAt !== null) {
            $responseStatus = 'completed';
        }

        return Inertia::render('surveys/question/ResponseDetail', [
            'survey' => [
                'id' => $survey->id,
                'name' => $survey->name,
                'created_with_ai' => (bool) $survey->created_with_ai,
            ],
            'recipient' => [
                'id' => $recipient->id,
                'names' => $recipient->names,
                'phone' => $recipient->phone,
                'email' => $recipient->email,
                'group_name' => $recipient->group?->name,
                'status' => $responseStatus,
                'timeline' => [
                    'invited_at' => $survey->created_at,
                    'sent_at' => $sentAt,
                    'replied_at' => $startedAt,
                    'completed_at' => $completedAt,
                ],
            ],
            'response' => [
                'started_at' => $startedAt,
                'completed_at' => $completedAt,
                'answers' => $questions,
                'messages' => $messages,
            ],
        ]);
    }

    private function exportResponses(Survey $survey, $recipients, string $format): StreamedResponse
    {
        $filename = sprintf(
            '%s-responses.%s',
            str($survey->name)->slug()->value(),
            $format
        );

        $headers = [
            'Content-Type' => $format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv; charset=UTF-8',
        ];

        return response()->streamDownload(function () use ($recipients): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, [
                'Name',
                'Phone',
                'Email',
                'Group',
                'Sent At',
                'Delivered At',
                'Replied At',
                'Completed At',
                'Response Status',
            ]);

            foreach ($recipients as $recipient) {
                $sentAt = $recipient->pivot?->sent_at;
                $startedAt = $recipient->pivot?->sms_flow_started_at;
                $completedAt = $recipient->pivot?->sms_flow_completed_at;
                $responseStatus = 'pending_send';

                if ($sentAt !== null) {
                    $responseStatus = 'awaiting_response';
                }

                if ($startedAt !== null) {
                    $responseStatus = 'in_progress';
                }

                if ($completedAt !== null) {
                    $responseStatus = 'completed';
                }

                fputcsv($output, [
                    $recipient->names,
                    $recipient->phone,
                    $recipient->email,
                    $recipient->group?->name,
                    $sentAt,
                    $sentAt,
                    $startedAt,
                    $completedAt,
                    $responseStatus,
                ]);
            }

            fclose($output);
        }, $filename, $headers);
    }

    private function exportAnswers(Survey $survey, $recipients, string $format): StreamedResponse
    {
        $questions = $survey->questions->values();
        $questionHeaders = $questions
            ->map(fn ($question, int $index): string => sprintf('Q%d: %s', $index + 1, $question->question))
            ->all();

        $optionTextById = $questions
            ->flatMap(fn ($question) => $question->options)
            ->mapWithKeys(fn ($option): array => [$option->id => $option->option])
            ->all();

        $recipientIds = $recipients->pluck('id')->all();
        $responses = $recipientIds === []
            ? collect()
            : SurveyResponse::query()
                ->where('survey_id', $survey->id)
                ->whereIn('contact_id', $recipientIds)
                ->with('answers')
                ->get()
                ->keyBy('contact_id');

        $filename = sprintf(
            '%s-answers.%s',
            str($survey->name)->slug()->value(),
            $format
        );

        $headers = [
            'Content-Type' => $format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv; charset=UTF-8',
        ];

        return response()->streamDownload(function () use (
            $recipients,
            $responses,
            $questions,
            $questionHeaders,
            $optionTextById
        ): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, [
                'Name',
                'Phone',
                'Email',
                'Group',
                'Sent At',
                'Started At',
                'Completed At',
                ...$questionHeaders,
            ]);

            foreach ($recipients as $recipient) {
                $response = $responses->get($recipient->id);
                $answersByQuestion = $response?->answers
                    ? $response->answers->keyBy('question_id')
                    : collect();

                $row = [
                    $recipient->names,
                    $recipient->phone,
                    $recipient->email,
                    $recipient->group?->name,
                    $recipient->pivot?->sent_at,
                    $response?->started_at,
                    $response?->completed_at,
                ];

                foreach ($questions as $question) {
                    $answer = $answersByQuestion->get($question->id);
                    $answerValue = '';

                    if ($answer !== null) {
                        if ($answer->option_id !== null) {
                            $answerValue = (string) ($optionTextById[$answer->option_id] ?? '');
                        } else {
                            $answerValue = (string) ($answer->answer_text ?? '');
                        }
                    }

                    $row[] = $answerValue;
                }

                fputcsv($output, $row);
            }

            fclose($output);
        }, $filename, $headers);
    }
}
