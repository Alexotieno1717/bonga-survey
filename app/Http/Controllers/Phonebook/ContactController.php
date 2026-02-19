<?php

declare(strict_types=1);

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contacts = Contact::where('user_id', Auth::id())
            ->with('group')
            ->get();

        //        return response()->json([
        //            'contacts' => $contacts,
        //        ]);

        return Inertia::render('Phonebook/Contact/Index', [
            'contacts' => $contacts,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Phonebook/Contact/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): void
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Contact $contact): void
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Contact $contact): void
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contact $contact): void
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contact $contact): void
    {
        //
    }

    //
    //    public function store(Request $request)
    //    {
    //        $validated = $request->validate([
    //            'names' => 'required|string|max:255',
    //            'phone' => 'required|string|unique:contacts,phone',
    //            'email' => 'nullable|email|unique:contacts,email',
    //            'gender' => 'nullable|in:male,female',
    //            'contact_group_id' => 'nullable|exists:contact_groups,id'
    //        ]);
    //
    //        $validated['user_id'] = Auth::id();
    //
    //        $contact = Contact::create($validated);
    //
    //        return response()->json([
    //            'message' => 'Contact created successfully',
    //            'contact' => $contact->load('contactGroup')
    //        ], 201);
    //    }
    //
    //    public function update(Request $request, Contact $contact)
    //    {
    //        // Ensure user owns this contact
    //        if ($contact->user_id !== Auth::id()) {
    //            return response()->json(['error' => 'Unauthorized'], 403);
    //        }
    //
    //        $validated = $request->validate([
    //            'names' => 'sometimes|string|max:255',
    //            'phone' => 'sometimes|string|unique:contacts,phone,' . $contact->id,
    //            'email' => 'nullable|email|unique:contacts,email,' . $contact->id,
    //            'gender' => 'nullable|in:male,female',
    //            'contact_group_id' => 'nullable|exists:contact_groups,id'
    //        ]);
    //
    //        $contact->update($validated);
    //
    //        return response()->json([
    //            'message' => 'Contact updated successfully',
    //            'contact' => $contact->load('contactGroup')
    //        ]);
    //    }
    //
    //    public function destroy(Contact $contact)
    //    {
    //        // Ensure user owns this contact
    //        if ($contact->user_id !== Auth::id()) {
    //            return response()->json(['error' => 'Unauthorized'], 403);
    //        }
    //
    //        $contact->delete();
    //
    //        return response()->json([
    //            'message' => 'Contact deleted successfully'
    //        ]);
    //    }
}
