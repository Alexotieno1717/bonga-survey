<?php

namespace App\Http\Controllers\Phonebook;

use App\Http\Controllers\Controller;
use App\Models\ContactGroupMap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactGroupMapController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Phonebook/ContactGroupMap/Index', [
            'contactgroupmaps' => ContactGroupMap::all(),
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
    public function show(ContactGroupMap $contactGroupMap)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ContactGroupMap $contactGroupMap)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ContactGroupMap $contactGroupMap)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContactGroupMap $contactGroupMap)
    {
        //
    }
}
