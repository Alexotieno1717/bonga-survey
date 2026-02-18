<?php

use App\Http\Controllers\Phonebook\ContactController;
use App\Http\Controllers\Phonebook\ContactGroupController;
use App\Http\Controllers\Phonebook\ContactGroupMapController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', fn () => Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
]))->name('home');

Route::get('dashboard', fn () => Inertia::render('dashboard'))->middleware(['auth', 'verified'])->name('dashboard');

Route::get('surveys/question', fn () => Inertia::render('surveys/question/Index'))->name('questions.index')->middleware(['auth']);
Route::get('surveys/question/create', fn () => Inertia::render('surveys/question/Create'))->name('questions.create')->middleware(['auth']);

Route::get('phonebook/contact', [contactController::class, 'index'])->name('contact.index')->middleware(['auth']);
Route::get('phonebook/contact/create', [contactController::class, 'create'])->name('contact.create')->middleware(['auth']);

Route::get('phonebook/contactgroup', [contactgroupController::class, 'index'])->name('contactgroup.index')->middleware(['auth']);

Route::get('phonebook/contactgroupmaps', [ContactGroupMapController::class, 'index'])->name('contactgroupmaps.index')->middleware(['auth']);

require __DIR__.'/settings.php';
