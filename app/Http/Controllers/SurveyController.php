<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SurveyController extends Controller
{
    public function index()
    {
        $surveys = Survey::all();

        return Inertia::render('surveys/question/Index', [
            'surveys' => $surveys,
        ]);
    }

    public function create()
    {
        // Fetch all contacts belonging to the authenticated user
        $contacts = Contact::where('user_id', Auth::id())
            ->with('group')
            ->get()
            ->map(function ($contact) {
                return [
                    'id' => $contact->id,
                    'names' => $contact->names,
                    'phone' => $contact->phone,
                    'email' => $contact->email,
                    'gender' => $contact->gender,
                    'contact_group' => $contact->contactGroup ? [
                        'id' => $contact->contactGroup->id,
                        'name' => $contact->contactGroup->name,
                    ] : null,
                ];
            });

        // Optional: Fetch contact groups for filtering
        $contactGroups = ContactGroup::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        //        return response()->json([
        //            'contacts' => $contacts,
        //            'contactGroups' => $contactGroups
        //        ]);

        return Inertia::render('surveys/question/Create', [
            'contacts' => $contacts,
            'contactGroups' => $contactGroups,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'surveyName' => 'required|string|max:255',
            'description' => 'required|string',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after:startDate',
            'triggerWord' => 'required|string|max:50|unique:surveys,trigger_word',
            'completionMessage' => 'nullable|string',
            'invitationMessage' => 'required|string',
            'scheduleTime' => 'required|date',
            'questions' => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.responseType' => 'required|in:free-text,multiple-choice',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'required_if:questions.*.responseType,multiple-choice|string',
            'questions.*.allowMultiple' => 'boolean',
            'questions.*.freeTextDescription' => 'nullable|string',
            'questions.*.branching' => 'nullable', // Remove array requirement
            'recipients' => 'required|array|min:1',
            'recipients.*.id' => 'required|exists:contacts,id',
        ]);

        try {
            DB::beginTransaction();

            // Create the survey
            $survey = Survey::create([
                'name' => $validated['surveyName'],
                'description' => $validated['description'],
                'start_date' => $validated['startDate'],
                'end_date' => $validated['endDate'],
                'trigger_word' => $validated['triggerWord'],
                'completion_message' => $validated['completionMessage'] ?? null,
                'invitation_message' => $validated['invitationMessage'],
                'scheduled_time' => $validated['scheduleTime'],
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            // Create questions and options
            foreach ($validated['questions'] as $index => $questionData) {
                // Handle branching data properly - it could be string, number, or array
                $branchingData = null;
                if (isset($questionData['branching'])) {
                    if (is_array($questionData['branching'])) {
                        // If it's already an array, encode it
                        $branchingData = json_encode($questionData['branching']);
                    } else {
                        // If it's a string or number, wrap it in an array
                        $branchingData = json_encode(['next_question' => $questionData['branching']]);
                    }
                }

                $question = $survey->questions()->create([
                    'question' => $questionData['question'],
                    'response_type' => $questionData['responseType'],
                    'free_text_description' => $questionData['freeTextDescription'] ?? null,
                    'allow_multiple' => $questionData['allowMultiple'] ?? false,
                    'order' => $index,
                    'branching' => $branchingData,
                ]);

                // Create options for multiple choice questions
                if ($questionData['responseType'] === 'multiple-choice' && ! empty($questionData['options'])) {
                    foreach ($questionData['options'] as $optionIndex => $optionText) {
                        if (! empty($optionText)) {
                            $optionBranching = null;
                            if (isset($questionData['branching'][$optionIndex]) && is_array($questionData['branching'])) {
                                $branchValue = $questionData['branching'][$optionIndex];
                                if (is_array($branchValue)) {
                                    $optionBranching = json_encode($branchValue);
                                } else {
                                    $optionBranching = json_encode(['next_question' => $branchValue]);
                                }
                            }

                            $question->options()->create([
                                'option' => $optionText,
                                'order' => $optionIndex,
                                'branching' => $optionBranching,
                            ]);
                        }
                    }
                }
            }

            // Attach contacts to the survey
            $contactIds = collect($validated['recipients'])->pluck('id')->toArray();

            $pivotData = [];
            foreach ($contactIds as $contactId) {
                $pivotData[$contactId] = [
                    'sent_at' => $validated['scheduleTime'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $survey->contacts()->attach($pivotData);

            DB::commit();

            return redirect()->route('questions.index')
                ->with('success', 'Survey created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Survey creation failed: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->all(),
            ]);

            return back()->withErrors([
                'error' => 'Failed to create survey: '.$e->getMessage(),
            ]);
        }
    }

    public function show(Survey $survey)
    {
        $surveys = Survey::with(['questions'])->get();

        return Inertia::render('surveys/question/Show', [
            'survey' => $survey->load('questions'),
        ]);
    }
}
