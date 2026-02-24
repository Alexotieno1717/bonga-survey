<?php

declare(strict_types=1);

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Http\Requests\Phonebook\StoreContactRequest;
use App\Http\Requests\Phonebook\UpdateContactRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(): Response
    {
        $contacts = Contact::query()
            ->where('user_id', Auth::id())
            ->with('group')
            ->latest()
            ->get();

        return Inertia::render('Phonebook/Contact/Index', [
            'contacts' => $contacts,
        ]);
    }

    public function create(): Response
    {
        $contactGroups = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Phonebook/Contact/Create', [
            'contactGroups' => $contactGroups,
        ]);
    }

    public function store(StoreContactRequest $request): RedirectResponse
    {
        Contact::query()->create([
            ...$request->validated(),
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('contact.index')
            ->with('success', 'Contact created successfully.');
    }

    public function show(Contact $contact): void
    {
        //
    }

    public function edit(Contact $contact): Response
    {
        abort_unless($contact->user_id === Auth::id(), 403);

        $contactGroups = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Phonebook/Contact/Edit', [
            'contact' => $contact,
            'contactGroups' => $contactGroups,
        ]);
    }

    public function update(UpdateContactRequest $request, Contact $contact): RedirectResponse
    {
        abort_unless($contact->user_id === Auth::id(), 403);

        $contact->update($request->validated());

        return redirect()->route('contact.index')
            ->with('success', 'Contact updated successfully.');
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        abort_unless($contact->user_id === Auth::id(), 403);

        $contact->delete();

        return redirect()->route('contact.index')
            ->with('success', 'Contact deleted successfully.');
    }
}
