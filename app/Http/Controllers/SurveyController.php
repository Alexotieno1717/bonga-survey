<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\CreateSurvey;
use App\Http\Requests\Survey\StoreSurveyRequest;
use App\Http\Requests\Survey\UpdateSurveyQuestionRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Question;
use App\Models\Survey;
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
            ->map(function ($contact) {
                return [
                    'id' => $contact->id,
                    'names' => $contact->names,
                    'phone' => $contact->phone,
                    'email' => $contact->email,
                    'gender' => $contact->gender,
                    'contact_group' => $contact->group ? [
                        'id' => $contact->group->id,
                        'name' => $contact->group->name,
                    ] : null,
                ];
            });

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

        $hasPublishedRecipients = $survey->contacts()
            ->whereNotNull('contact_survey.sent_at')
            ->exists();

        if ($survey->status !== 'draft' || $hasPublishedRecipients) {
            abort(403, 'Only unpublished draft surveys can be edited.');
        }

        $validated = $request->validated();
        $responseType = (string) $validated['response_type'];

        $question->update([
            'question' => (string) $validated['question'],
            'response_type' => $responseType,
            'allow_multiple' => $responseType === 'multiple-choice'
                ? (bool) ($validated['allow_multiple'] ?? false)
                : false,
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

        if (! in_array($status, ['all', 'sent', 'pending'], true)) {
            $status = 'all';
        }

        $availableGroupIds = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->pluck('id')
            ->all();

        if (! in_array($groupId, $availableGroupIds, true)) {
            $groupId = null;
        }

        $baseRecipientsQuery = function () use (
            $survey,
            $search,
            $status,
            $groupId,
            $dateFrom,
            $dateTo
        ): BelongsToMany {
            return $survey->contacts()
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
                ->when($dateFrom !== null, function (Builder $query) use ($dateFrom): void {
                    $query->whereDate('contact_survey.sent_at', '>=', $dateFrom);
                })
                ->when($dateTo !== null, function (Builder $query) use ($dateTo): void {
                    $query->whereDate('contact_survey.sent_at', '<=', $dateTo);
                });
        };

        if (in_array($exportFormat, ['csv', 'xlsx'], true)) {
            $allRecipients = $baseRecipientsQuery()
                ->orderBy('contacts.names')
                ->get();

            return $this->exportResponses($survey, $allRecipients, $exportFormat);
        }

        $totalRecipients = $baseRecipientsQuery()->count();
        $sentRecipients = $baseRecipientsQuery()
            ->whereNotNull('contact_survey.sent_at')
            ->count();
        $pendingRecipients = max(0, $totalRecipients - $sentRecipients);

        $responseCount = 0;
        $startedCount = $responseCount;
        $completedCount = $responseCount;
        $completionRate = $totalRecipients > 0
            ? round(($completedCount / $totalRecipients) * 100, 2)
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

        $today = now()->startOfDay();
        $timeSeries = collect(range(6, 0))
            ->map(function (int $daysAgo) use ($today, $sentSeries): array {
                $date = $today->copy()->subDays($daysAgo)->toDateString();

                return [
                    'date' => $date,
                    'label' => $today->copy()->subDays($daysAgo)->format('M d'),
                    'invitations_sent' => (int) ($sentSeries[$date] ?? 0),
                    'responses_received' => 0,
                ];
            })
            ->values()
            ->all();

        $questionAnalytics = $survey->questions
            ->map(function ($question): array {
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'response_type' => $question->response_type,
                    'total_responses' => 0,
                    'free_text_count' => $question->response_type === 'free-text' ? 0 : null,
                    'options' => $question->options
                        ->map(function ($option): array {
                            return [
                                'id' => $option->id,
                                'option' => $option->option,
                                'count' => 0,
                            ];
                        })
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
                        'replied_at' => null,
                        'completed_at' => null,
                    ],
                    'response_status' => $sentAt ? 'awaiting_response' : 'pending_send',
                ];
            });

        return Inertia::render('surveys/question/Responses', [
            'survey' => [
                'id' => $survey->id,
                'name' => $survey->name,
                'status' => $survey->status,
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
                'completion_rate' => $completionRate,
            ],
            'funnel' => [
                'invited' => $totalRecipients,
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

                fputcsv($output, [
                    $recipient->names,
                    $recipient->phone,
                    $recipient->email,
                    $recipient->group?->name,
                    $sentAt,
                    $sentAt,
                    '',
                    '',
                    $sentAt ? 'awaiting_response' : 'pending_send',
                ]);
            }

            fclose($output);
        }, $filename, $headers);
    }
}
