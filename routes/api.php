<?php

use App\Http\Controllers\Phonebook\ContactController;
use App\Http\Controllers\SurveySmsWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', fn (Request $request) => $request->user())->middleware('auth:sanctum');

// Route::middleware('auth:sanctum')->group(function () {
Route::get('/contacts', [ContactController::class, 'index']);
Route::post('/contacts', [ContactController::class, 'store']);
Route::put('/contacts/{contact}', [ContactController::class, 'update']);
Route::delete('/contacts/{contact}', [ContactController::class, 'destroy']);
// });

Route::match(['GET', 'POST'], '/sms/incoming', SurveySmsWebhookController::class)->name('sms.incoming');
Route::match(['GET', 'POST'], '/sms/webhook', SurveySmsWebhookController::class)->name('sms.webhook');
