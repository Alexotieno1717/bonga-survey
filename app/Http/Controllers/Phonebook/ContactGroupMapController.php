<?php

declare(strict_types=1);

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Http\Requests\Phonebook\StoreContactGroupMapRequest;
use App\Http\Requests\Phonebook\UpdateContactGroupMapRequest;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\ContactGroupMap;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ContactGroupMapController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Phonebook/ContactGroupMap/Index', [
            'contactgroupmaps' => ContactGroupMap::query()
                ->where('user_id', Auth::id())
                ->with(['contact:id,names,phone,email', 'contactGroup:id,name'])
                ->latest()
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Phonebook/ContactGroupMap/Create', [
            'contacts' => Contact::query()
                ->where('user_id', Auth::id())
                ->orderBy('names')
                ->get(['id', 'names', 'phone']),
            'contactGroups' => ContactGroup::query()
                ->where('user_id', Auth::id())
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreContactGroupMapRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $contact = Contact::query()
            ->where('user_id', Auth::id())
            ->findOrFail((int) $validated['contact_id']);

        $group = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->findOrFail((int) $validated['contact_group_id']);

        ContactGroupMap::query()->create([
            'user_id' => Auth::id(),
            'contact_id' => $contact->id,
            'contact_group_id' => $group->id,
            'group' => $group->name,
            'phone' => (string) $contact->phone,
            'status' => $validated['status'],
        ]);

        return redirect()->route('contactgroupmaps.index')
            ->with('success', 'Contact group mapping created successfully.');
    }

    public function show(ContactGroupMap $contactGroupMap): void
    {
        //
    }

    public function edit(ContactGroupMap $contactGroupMap): Response
    {
        abort_unless($contactGroupMap->user_id === Auth::id(), 403);

        return Inertia::render('Phonebook/ContactGroupMap/Edit', [
            'contactGroupMap' => $contactGroupMap,
            'contacts' => Contact::query()
                ->where('user_id', Auth::id())
                ->orderBy('names')
                ->get(['id', 'names', 'phone']),
            'contactGroups' => ContactGroup::query()
                ->where('user_id', Auth::id())
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(UpdateContactGroupMapRequest $request, ContactGroupMap $contactGroupMap): RedirectResponse
    {
        abort_unless($contactGroupMap->user_id === Auth::id(), 403);

        $validated = $request->validated();

        $contact = Contact::query()
            ->where('user_id', Auth::id())
            ->findOrFail((int) $validated['contact_id']);

        $group = ContactGroup::query()
            ->where('user_id', Auth::id())
            ->findOrFail((int) $validated['contact_group_id']);

        $contactGroupMap->update([
            'contact_id' => $contact->id,
            'contact_group_id' => $group->id,
            'group' => $group->name,
            'phone' => (string) $contact->phone,
            'status' => $validated['status'],
        ]);

        return redirect()->route('contactgroupmaps.index')
            ->with('success', 'Contact group mapping updated successfully.');
    }

    public function destroy(ContactGroupMap $contactGroupMap): RedirectResponse
    {
        abort_unless($contactGroupMap->user_id === Auth::id(), 403);

        $contactGroupMap->delete();

        return redirect()->route('contactgroupmaps.index')
            ->with('success', 'Contact group mapping deleted successfully.');
    }
}
