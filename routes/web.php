<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Phonebook\ContactController;
use App\Http\Controllers\Phonebook\ContactGroupController;
use App\Http\Controllers\Phonebook\ContactGroupMapController;
use App\Http\Controllers\SurveyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', fn () => Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
]))->name('home');

Route::get('dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::get('surveys/question', [SurveyController::class, 'index'])->name('questions.index')->middleware(['auth']);
Route::get('surveys/question/create', [SurveyController::class, 'create'])->name('questions.create')->middleware(['auth']);
Route::post('surveys/question', [SurveyController::class, 'store'])->name('questions.store')->middleware(['auth']);
// Route::get('surveys/question/{question}', [SurveyController::class, 'show'])->name('questions.show')->middleware(['auth']);
Route::get('surveys/responses', [SurveyController::class, 'responsesIndex'])->middleware(['auth'])->name('surveys.responses.index');
Route::get('surveys/{survey}', [SurveyController::class, 'show'])->middleware(['auth'])->name('surveys.show');
Route::get('surveys/{survey}/responses', [SurveyController::class, 'responses'])->middleware(['auth'])->name('surveys.responses');

Route::get('phonebook/contact', [contactController::class, 'index'])->name('contact.index')->middleware(['auth']);
Route::get('phonebook/contact/create', [contactController::class, 'create'])->name('contact.create')->middleware(['auth']);
Route::post('phonebook/contact', [contactController::class, 'store'])->name('contact.store')->middleware(['auth']);
Route::get('phonebook/contact/{contact}/edit', [contactController::class, 'edit'])->name('contact.edit')->middleware(['auth']);
Route::put('phonebook/contact/{contact}', [contactController::class, 'update'])->name('contact.update')->middleware(['auth']);
Route::delete('phonebook/contact/{contact}', [contactController::class, 'destroy'])->name('contact.destroy')->middleware(['auth']);

Route::get('phonebook/contactgroup', [contactgroupController::class, 'index'])->name('contactgroup.index')->middleware(['auth']);
Route::get('phonebook/contactgroup/create', [contactgroupController::class, 'create'])->name('contactgroup.create')->middleware(['auth']);
Route::post('phonebook/contactgroup', [contactgroupController::class, 'store'])->name('contactgroup.store')->middleware(['auth']);
Route::get('phonebook/contactgroup/{contactGroup}/edit', [contactgroupController::class, 'edit'])->name('contactgroup.edit')->middleware(['auth']);
Route::put('phonebook/contactgroup/{contactGroup}', [contactgroupController::class, 'update'])->name('contactgroup.update')->middleware(['auth']);
Route::delete('phonebook/contactgroup/{contactGroup}', [contactgroupController::class, 'destroy'])->name('contactgroup.destroy')->middleware(['auth']);

Route::get('phonebook/contactgroupmaps', [ContactGroupMapController::class, 'index'])->name('contactgroupmaps.index')->middleware(['auth']);
Route::get('phonebook/contactgroupmaps/create', [ContactGroupMapController::class, 'create'])->name('contactgroupmaps.create')->middleware(['auth']);
Route::post('phonebook/contactgroupmaps', [ContactGroupMapController::class, 'store'])->name('contactgroupmaps.store')->middleware(['auth']);
Route::get('phonebook/contactgroupmaps/{contactGroupMap}/edit', [ContactGroupMapController::class, 'edit'])->name('contactgroupmaps.edit')->middleware(['auth']);
Route::put('phonebook/contactgroupmaps/{contactGroupMap}', [ContactGroupMapController::class, 'update'])->name('contactgroupmaps.update')->middleware(['auth']);
Route::delete('phonebook/contactgroupmaps/{contactGroupMap}', [ContactGroupMapController::class, 'destroy'])->name('contactgroupmaps.destroy')->middleware(['auth']);

require __DIR__.'/settings.php';
