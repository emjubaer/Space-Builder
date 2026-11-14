<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\CompanyProfileController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyTypeController;
use App\Http\Controllers\Api\TestimonialController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->name('api.register');

Route::get('/company-profile', [CompanyProfileController::class, 'show'])->name('api.company-profile.show');
Route::get('/testimonials', [TestimonialController::class, 'index'])->name('api.testimonials.index');

Route::get('/blogs', [BlogController::class, 'index'])->name('api.blogs.index');
Route::get('/blogs/{slug}/related', [BlogController::class, 'related'])->name('api.blogs.related');
Route::get('/blogs/{slug}', [BlogController::class, 'show'])->name('api.blogs.show');

Route::get('/property-types', [PropertyTypeController::class, 'index'])->name('api.property-types.index');
Route::get('/locations', [LocationController::class, 'index'])->name('api.locations.index');

Route::get('/properties/featured', [PropertyController::class, 'featured'])->name('api.properties.featured');
Route::get('/properties', [PropertyController::class, 'index'])->name('api.properties.index');
Route::get('/properties/{slug}/construction', [PropertyController::class, 'construction'])->name('api.properties.construction');
Route::get('/properties/{slug}', [PropertyController::class, 'show'])->name('api.properties.show');

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.password.email');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('api.password.update');
    Route::post('/contact-messages', [ContactMessageController::class, 'store'])->name('api.contact-messages.store');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
});
