<?php

declare(strict_types=1);

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Http\Requests\Phonebook\StoreContactGroupRequest;
use App\Http\Requests\Phonebook\UpdateContactGroupRequest;
use App\Models\ContactGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ContactGroupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Phonebook/ContactGroup/Index', [
            'contactgroups' => ContactGroup::query()
                ->where('user_id', Auth::id())
                ->with('user:id,name')
                ->latest()
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Phonebook/ContactGroup/Create');
    }

    public function store(StoreContactGroupRequest $request): RedirectResponse
    {
        ContactGroup::query()->create([
            ...$request->validated(),
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('contactgroup.index')
            ->with('success', 'Contact group created successfully.');
    }

    public function show(ContactGroup $contactGroup): void
    {
        //
    }

    public function edit(ContactGroup $contactGroup): Response
    {
        abort_unless($contactGroup->user_id === Auth::id(), 403);

        return Inertia::render('Phonebook/ContactGroup/Edit', [
            'contactGroup' => $contactGroup,
        ]);
    }

    public function update(UpdateContactGroupRequest $request, ContactGroup $contactGroup): RedirectResponse
    {
        abort_unless($contactGroup->user_id === Auth::id(), 403);

        $contactGroup->update($request->validated());

        return redirect()->route('contactgroup.index')
            ->with('success', 'Contact group updated successfully.');
    }

    public function destroy(ContactGroup $contactGroup): RedirectResponse
    {
        abort_unless($contactGroup->user_id === Auth::id(), 403);

        $contactGroup->delete();

        return redirect()->route('contactgroup.index')
            ->with('success', 'Contact group deleted successfully.');
    }
}
