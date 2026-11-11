<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyProfileController;
use App\Http\Controllers\Api\ContactMessageController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->name('api.register');

Route::get('/company-profile', [CompanyProfileController::class, 'show'])->name('api.company-profile.show');

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.password.email');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('api.password.update');
    Route::post('/contact-messages', [ContactMessageController::class, 'store'])->name('api.contact-messages.store');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
});
