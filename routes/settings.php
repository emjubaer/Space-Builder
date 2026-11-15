<?php

use App\Http\Controllers\Admin\Website\CompanyProfileController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::middleware(['auth'])->prefix('settings/website-general')->name('settings.website-general.')->group(function () {
    Route::get('/', [CompanyProfileController::class, 'index'])->middleware('permission:company_profile_view')->name('index');
    Route::post('/', [CompanyProfileController::class, 'update'])->middleware('permission:company_profile_update')->name('update');
    Route::post('social-links', [CompanyProfileController::class, 'storeSocialLink'])->middleware('permission:company_profile_update')->name('social-links.store');
    Route::put('social-links/{socialLink}', [CompanyProfileController::class, 'updateSocialLink'])->middleware('permission:company_profile_update')->name('social-links.update');
    Route::delete('social-links/{socialLink}', [CompanyProfileController::class, 'destroySocialLink'])->middleware('permission:company_profile_update')->name('social-links.destroy');
    Route::post('offices', [CompanyProfileController::class, 'storeOffice'])->middleware('permission:company_profile_update')->name('offices.store');
    Route::put('offices/{office}', [CompanyProfileController::class, 'updateOffice'])->middleware('permission:company_profile_update')->name('offices.update');
    Route::delete('offices/{office}', [CompanyProfileController::class, 'destroyOffice'])->middleware('permission:company_profile_update')->name('offices.destroy');
});
