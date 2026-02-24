<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Survey\CreateSurvey;
use App\Http\Requests\Survey\StoreSurveyRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Survey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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

        return Inertia::render('surveys/question/Create', [
            'contacts' => $contacts,
            'contactGroups' => $contactGroups,
        ]);
    }

    public function store(StoreSurveyRequest $request): RedirectResponse
    {
        $this->createSurvey->handle($request->validated(), (int) $request->user()->id);

        return redirect()->route('questions.index')
            ->with('success', 'Survey created successfully!');
    }

    public function show(Survey $survey): Response
    {
        return Inertia::render('surveys/question/Show', [
            'survey' => $survey->load('questions.options'),
        ]);
    }
}
