<?php

use App\Http\Controllers\Admin\Blog\BlogAuthorController;
use App\Http\Controllers\Admin\Blog\BlogCategoryController;
use App\Http\Controllers\Admin\Blog\BlogController;
use App\Http\Controllers\Admin\Blog\BlogMediaController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\Website\CompanyProfileController;
use App\Http\Controllers\Admin\Website\ContactMessageController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/list', [UserController::class, 'list'])->name('users.list');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('users/{user}/change-password', [UserController::class, 'changePassword'])->name('users.change-password');

    Route::get('role', [RoleController::class, 'index'])->name('role.index');
    Route::get('role/list', [RoleController::class, 'list'])->name('role.list');
    Route::post('role', [RoleController::class, 'store'])->name('role.store');
    Route::put('role/{role}', [RoleController::class, 'update'])->name('role.update');
    Route::delete('role/{role}', [RoleController::class, 'destroy'])->name('role.destroy');

    Route::get('permission', [PermissionController::class, 'index'])->name('permission.index');
    Route::get('permission/list', [PermissionController::class, 'list'])->name('permission.list');

    Route::get('notifications/list', [NotificationController::class, 'list'])->name('notifications.list');
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    Route::post('blogs/media', [BlogMediaController::class, 'store'])->name('blogs.media.store');

    Route::get('blogs/categories', [BlogCategoryController::class, 'index'])->name('blogs.categories.index');
    Route::get('blogs/categories/list', [BlogCategoryController::class, 'list'])->name('blogs.categories.list');
    Route::post('blogs/categories', [BlogCategoryController::class, 'store'])->name('blogs.categories.store');
    Route::put('blogs/categories/{blogCategory}', [BlogCategoryController::class, 'update'])->name('blogs.categories.update');
    Route::delete('blogs/categories/{blogCategory}', [BlogCategoryController::class, 'destroy'])->name('blogs.categories.destroy');

    Route::get('blogs/authors', [BlogAuthorController::class, 'index'])->name('blogs.authors.index');
    Route::get('blogs/authors/list', [BlogAuthorController::class, 'list'])->name('blogs.authors.list');
    Route::get('blogs/authors/users', [BlogAuthorController::class, 'users'])->name('blogs.authors.users');
    Route::post('blogs/authors', [BlogAuthorController::class, 'store'])->name('blogs.authors.store');
    Route::put('blogs/authors/{blogAuthor}', [BlogAuthorController::class, 'update'])->name('blogs.authors.update');
    Route::delete('blogs/authors/{blogAuthor}', [BlogAuthorController::class, 'destroy'])->name('blogs.authors.destroy');

    Route::get('blogs', [BlogController::class, 'index'])->name('blogs.index');
    Route::get('blogs/list', [BlogController::class, 'list'])->name('blogs.list');
    Route::get('blogs/create', [BlogController::class, 'create'])->name('blogs.create');
    Route::post('blogs', [BlogController::class, 'store'])->name('blogs.store');
    Route::get('blogs/{blog}/edit', [BlogController::class, 'edit'])->name('blogs.edit');
    Route::get('blogs/{blog}/preview', [BlogController::class, 'preview'])->name('blogs.preview');
    Route::put('blogs/{blog}', [BlogController::class, 'update'])->name('blogs.update');
    Route::post('blogs/{blog}/mark-as-draft', [BlogController::class, 'markAsDraft'])->name('blogs.mark-as-draft');
    Route::post('blogs/{blog}/mark-as-published', [BlogController::class, 'markAsPublished'])->name('blogs.mark-as-published');
    Route::delete('blogs/{blog}', [BlogController::class, 'destroy'])->name('blogs.destroy');

    Route::get('website/general', [CompanyProfileController::class, 'index'])->name('website.general.index');
    Route::post('website/general', [CompanyProfileController::class, 'update'])->name('website.general.update');
    Route::post('website/general/social-links', [CompanyProfileController::class, 'storeSocialLink'])->name('website.general.social-links.store');
    Route::put('website/general/social-links/{socialLink}', [CompanyProfileController::class, 'updateSocialLink'])->name('website.general.social-links.update');
    Route::delete('website/general/social-links/{socialLink}', [CompanyProfileController::class, 'destroySocialLink'])->name('website.general.social-links.destroy');
    Route::post('website/general/offices', [CompanyProfileController::class, 'storeOffice'])->name('website.general.offices.store');
    Route::put('website/general/offices/{office}', [CompanyProfileController::class, 'updateOffice'])->name('website.general.offices.update');
    Route::delete('website/general/offices/{office}', [CompanyProfileController::class, 'destroyOffice'])->name('website.general.offices.destroy');

    Route::redirect('website/company', '/admin/website/general');

    Route::get('website/contacts', [ContactMessageController::class, 'index'])->name('website.contacts.index');
    Route::get('website/contacts/list', [ContactMessageController::class, 'list'])->name('website.contacts.list');
    Route::get('website/contacts/{contactMessage}', [ContactMessageController::class, 'show'])->name('website.contacts.show');
    Route::put('website/contacts/{contactMessage}/status', [ContactMessageController::class, 'updateStatus'])->name('website.contacts.status');
    Route::delete('website/contacts/{contactMessage}', [ContactMessageController::class, 'destroy'])->name('website.contacts.destroy');
});
