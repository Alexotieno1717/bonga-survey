<?php

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Models\ContactGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactGroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Phonebook/ContactGroup/Index', [
            'contactgroups' => ContactGroup::with('user')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ContactGroup $contactGroup)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ContactGroup $contactGroup)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ContactGroup $contactGroup)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContactGroup $contactGroup)
    {
        //
    }
}
