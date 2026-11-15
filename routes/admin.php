<?php

use App\Http\Controllers\Admin\Blog\BlogAuthorController;
use App\Http\Controllers\Admin\Blog\BlogCategoryController;
use App\Http\Controllers\Admin\Blog\BlogController;
use App\Http\Controllers\Admin\Blog\BlogMediaController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\Property\ConstructionTaskController;
use App\Http\Controllers\Admin\Property\LocationController;
use App\Http\Controllers\Admin\Property\PropertyController;
use App\Http\Controllers\Admin\Property\PropertyFeatureController;
use App\Http\Controllers\Admin\Property\PropertyTypeController;
use App\Http\Controllers\Admin\ReferralController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\Website\ContactMessageController;
use App\Http\Controllers\Admin\Website\NewsletterSubscriberController;
use App\Http\Controllers\Admin\Website\TestimonialController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->middleware(['auth'])->group(function () {
    Route::middleware('permission:user_view')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/list', [UserController::class, 'list'])->name('users.list');
    });
    Route::post('users', [UserController::class, 'store'])->middleware('permission:user_create')->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:user_update')->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:user_delete')->name('users.destroy');
    Route::post('users/{user}/change-password', [UserController::class, 'changePassword'])->middleware('permission:user_update')->name('users.change-password');

    Route::middleware('permission:role_view')->group(function () {
        Route::get('role', [RoleController::class, 'index'])->name('role.index');
        Route::get('role/list', [RoleController::class, 'list'])->name('role.list');
    });
    Route::post('role', [RoleController::class, 'store'])->middleware('permission:role_create')->name('role.store');
    Route::put('role/{role}', [RoleController::class, 'update'])->middleware('permission:role_update')->name('role.update');
    Route::delete('role/{role}', [RoleController::class, 'destroy'])->middleware('permission:role_delete')->name('role.destroy');

    Route::middleware('permission:permission_view')->group(function () {
        Route::get('permission', [PermissionController::class, 'index'])->name('permission.index');
        Route::get('permission/list', [PermissionController::class, 'list'])->name('permission.list');
    });

    Route::middleware('permission:notification_view')->group(function () {
        Route::get('notifications/list', [NotificationController::class, 'list'])->name('notifications.list');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    });

    Route::post('blogs/media', [BlogMediaController::class, 'store'])->middleware('permission:blog_create|blog_update')->name('blogs.media.store');

    Route::get('blogs/categories', [BlogCategoryController::class, 'index'])->middleware('permission:blog_category_create|blog_category_update|blog_category_delete')->name('blogs.categories.index');
    Route::get('blogs/categories/list', [BlogCategoryController::class, 'list'])->middleware('permission:blog_category_view|blog_category_create|blog_category_update|blog_category_delete')->name('blogs.categories.list');
    Route::post('blogs/categories', [BlogCategoryController::class, 'store'])->middleware('permission:blog_category_create')->name('blogs.categories.store');
    Route::put('blogs/categories/{blogCategory}', [BlogCategoryController::class, 'update'])->middleware('permission:blog_category_update')->name('blogs.categories.update');
    Route::delete('blogs/categories/{blogCategory}', [BlogCategoryController::class, 'destroy'])->middleware('permission:blog_category_delete')->name('blogs.categories.destroy');

    Route::middleware('permission:blog_author_view')->group(function () {
        Route::get('blogs/authors', [BlogAuthorController::class, 'index'])->name('blogs.authors.index');
        Route::get('blogs/authors/list', [BlogAuthorController::class, 'list'])->name('blogs.authors.list');
        Route::get('blogs/authors/users', [BlogAuthorController::class, 'users'])->name('blogs.authors.users');
    });
    Route::post('blogs/authors', [BlogAuthorController::class, 'store'])->middleware('permission:blog_author_create')->name('blogs.authors.store');
    Route::put('blogs/authors/{blogAuthor}', [BlogAuthorController::class, 'update'])->middleware('permission:blog_author_update')->name('blogs.authors.update');
    Route::delete('blogs/authors/{blogAuthor}', [BlogAuthorController::class, 'destroy'])->middleware('permission:blog_author_delete')->name('blogs.authors.destroy');

    Route::middleware('permission:blog_view')->group(function () {
        Route::get('blogs', [BlogController::class, 'index'])->name('blogs.index');
        Route::get('blogs/list', [BlogController::class, 'list'])->name('blogs.list');
        Route::get('blogs/{blog}/preview', [BlogController::class, 'preview'])->name('blogs.preview');
    });
    Route::get('blogs/create', [BlogController::class, 'create'])->middleware('permission:blog_create')->name('blogs.create');
    Route::post('blogs', [BlogController::class, 'store'])->middleware('permission:blog_create')->name('blogs.store');
    Route::middleware('permission:blog_update')->group(function () {
        Route::get('blogs/{blog}/edit', [BlogController::class, 'edit'])->name('blogs.edit');
        Route::put('blogs/{blog}', [BlogController::class, 'update'])->name('blogs.update');
        Route::post('blogs/{blog}/mark-as-draft', [BlogController::class, 'markAsDraft'])->name('blogs.mark-as-draft');
        Route::post('blogs/{blog}/mark-as-published', [BlogController::class, 'markAsPublished'])->name('blogs.mark-as-published');
    });
    Route::delete('blogs/{blog}', [BlogController::class, 'destroy'])->middleware('permission:blog_delete')->name('blogs.destroy');

    Route::redirect('website/general', '/settings/website-general');
    Route::redirect('website/company', '/settings/website-general');

    Route::middleware('permission:referral_view')->group(function () {
        Route::get('referrals', [ReferralController::class, 'index'])->name('referrals.index');
        Route::get('referrals/list', [ReferralController::class, 'list'])->name('referrals.list');
    });
    Route::put('referrals/{referral}/status', [ReferralController::class, 'updateStatus'])->middleware('permission:referral_update')->name('referrals.status');

    Route::middleware('permission:contact_view')->group(function () {
        Route::get('website/contacts', [ContactMessageController::class, 'index'])->name('website.contacts.index');
        Route::get('website/contacts/list', [ContactMessageController::class, 'list'])->name('website.contacts.list');
        Route::get('website/contacts/{contactMessage}', [ContactMessageController::class, 'show'])->name('website.contacts.show');
    });
    Route::put('website/contacts/{contactMessage}/status', [ContactMessageController::class, 'updateStatus'])->middleware('permission:contact_update')->name('website.contacts.status');
    Route::delete('website/contacts/{contactMessage}', [ContactMessageController::class, 'destroy'])->middleware('permission:contact_delete')->name('website.contacts.destroy');

    Route::middleware('permission:newsletter_view')->group(function () {
        Route::get('website/newsletter', [NewsletterSubscriberController::class, 'index'])->name('website.newsletter.index');
        Route::get('website/newsletter/list', [NewsletterSubscriberController::class, 'list'])->name('website.newsletter.list');
    });
    Route::put('website/newsletter/{newsletterSubscriber}/status', [NewsletterSubscriberController::class, 'updateStatus'])->middleware('permission:newsletter_update')->name('website.newsletter.status');
    Route::delete('website/newsletter/{newsletterSubscriber}', [NewsletterSubscriberController::class, 'destroy'])->middleware('permission:newsletter_delete')->name('website.newsletter.destroy');

    Route::middleware('permission:testimonial_view')->group(function () {
        Route::get('website/testimonials', [TestimonialController::class, 'index'])->name('website.testimonials.index');
        Route::get('website/testimonials/list', [TestimonialController::class, 'list'])->name('website.testimonials.list');
    });
    Route::post('website/testimonials', [TestimonialController::class, 'store'])->middleware('permission:testimonial_create')->name('website.testimonials.store');
    Route::post('website/testimonials/{testimonial}', [TestimonialController::class, 'update'])->middleware('permission:testimonial_update')->name('website.testimonials.update');
    Route::delete('website/testimonials/{testimonial}', [TestimonialController::class, 'destroy'])->middleware('permission:testimonial_delete')->name('website.testimonials.destroy');

    Route::middleware('permission:property_feature_view')->group(function () {
        Route::get('properties/features', [PropertyFeatureController::class, 'index'])->name('properties.features.index');
        Route::get('properties/features/list', [PropertyFeatureController::class, 'list'])->name('properties.features.list');
    });
    Route::post('properties/features', [PropertyFeatureController::class, 'store'])->middleware('permission:property_feature_create')->name('properties.features.store');
    Route::put('properties/features/{propertyFeature}', [PropertyFeatureController::class, 'update'])->middleware('permission:property_feature_update')->name('properties.features.update');
    Route::delete('properties/features/{propertyFeature}', [PropertyFeatureController::class, 'destroy'])->middleware('permission:property_feature_delete')->name('properties.features.destroy');

    Route::middleware('permission:property_type_view')->group(function () {
        Route::get('properties/types', [PropertyTypeController::class, 'index'])->name('properties.types.index');
        Route::get('properties/types/list', [PropertyTypeController::class, 'list'])->name('properties.types.list');
    });
    Route::post('properties/types', [PropertyTypeController::class, 'store'])->middleware('permission:property_type_create')->name('properties.types.store');
    Route::put('properties/types/{propertyType}', [PropertyTypeController::class, 'update'])->middleware('permission:property_type_update')->name('properties.types.update');
    Route::delete('properties/types/{propertyType}', [PropertyTypeController::class, 'destroy'])->middleware('permission:property_type_delete')->name('properties.types.destroy');

    Route::middleware('permission:location_view')->group(function () {
        Route::get('properties/locations', [LocationController::class, 'index'])->name('properties.locations.index');
        Route::get('properties/locations/list', [LocationController::class, 'list'])->name('properties.locations.list');
    });
    Route::post('properties/locations', [LocationController::class, 'store'])->middleware('permission:location_create')->name('properties.locations.store');
    Route::put('properties/locations/{location}', [LocationController::class, 'update'])->middleware('permission:location_update')->name('properties.locations.update');
    Route::delete('properties/locations/{location}', [LocationController::class, 'destroy'])->middleware('permission:location_delete')->name('properties.locations.destroy');

    Route::middleware('permission:property_view')->group(function () {
        Route::get('properties', [PropertyController::class, 'index'])->name('properties.index');
        Route::get('properties/list', [PropertyController::class, 'list'])->name('properties.list');
        Route::get('properties/{property}/construction-tasks', [ConstructionTaskController::class, 'index'])->name('properties.construction-tasks.index');
    });
    Route::get('properties/create', [PropertyController::class, 'create'])->middleware('permission:property_create')->name('properties.create');
    Route::post('properties', [PropertyController::class, 'store'])->middleware('permission:property_create')->name('properties.store');
    Route::middleware('permission:property_update')->group(function () {
        Route::get('properties/{property}/edit', [PropertyController::class, 'edit'])->name('properties.edit');
        Route::put('properties/{property}', [PropertyController::class, 'update'])->name('properties.update');
        Route::post('properties/{property}/construction-tasks', [ConstructionTaskController::class, 'store'])->name('properties.construction-tasks.store');
        Route::post('properties/{property}/construction-tasks/apply-defaults', [ConstructionTaskController::class, 'applyDefaults'])->name('properties.construction-tasks.apply-defaults');
        Route::put('properties/{property}/construction-tasks/{constructionTask}', [ConstructionTaskController::class, 'update'])->name('properties.construction-tasks.update');
        Route::patch('properties/{property}/construction-tasks/{constructionTask}/progress', [ConstructionTaskController::class, 'updateProgress'])->name('properties.construction-tasks.progress');
    });
    Route::delete('properties/{property}', [PropertyController::class, 'destroy'])->middleware('permission:property_delete')->name('properties.destroy');
    Route::delete('properties/{property}/construction-tasks/{constructionTask}', [ConstructionTaskController::class, 'destroy'])->middleware('permission:property_delete')->name('properties.construction-tasks.destroy');
});
