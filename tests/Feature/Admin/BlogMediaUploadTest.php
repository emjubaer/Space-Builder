<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function blogMediaAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'blog-media-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot upload blog editor media', function () {
    $this->postJson(route('admin.blogs.media.store'), [])
        ->assertUnauthorized();
});

test('non admin users cannot upload blog editor media', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    Storage::fake('public');

    $this->actingAs($user)
        ->postJson(route('admin.blogs.media.store'), [
            'image' => UploadedFile::fake()->image('photo.jpg', 800, 600),
        ])
        ->assertForbidden();
});

test('admin can upload optimized blog editor image as webp', function () {
    Storage::fake('public');
    $admin = blogMediaAdminUser();

    $response = $this->actingAs($admin)
        ->postJson(route('admin.blogs.media.store'), [
            'image' => UploadedFile::fake()->image('building.jpg', 2400, 1600),
            'alt' => 'Modern apartment exterior',
            'compress' => true,
            'quality' => 80,
            'max_width' => 1600,
            'format' => 'webp',
        ]);

    $response->assertCreated()
        ->assertJsonStructure(['path', 'url', 'name', 'alt']);

    expect($response->json('alt'))->toBe('Modern apartment exterior')
        ->and($response->json('name'))->toBe('building.jpg')
        ->and($response->json('path'))->toEndWith('.webp');

    Storage::disk('public')->assertExists($response->json('path'));
});

test('admin can upload blog editor image as jpeg when requested', function () {
    Storage::fake('public');
    $admin = blogMediaAdminUser();

    $response = $this->actingAs($admin)
        ->postJson(route('admin.blogs.media.store'), [
            'image' => UploadedFile::fake()->image('plan.png', 1200, 900),
            'format' => 'jpg',
            'max_width' => 800,
        ]);

    $response->assertCreated();

    expect($response->json('path'))->toEndWith('.jpg');

    Storage::disk('public')->assertExists($response->json('path'));
});

test('blog editor media upload requires an image', function () {
    Storage::fake('public');
    $admin = blogMediaAdminUser();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.media.store'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

test('blog editor media upload rejects invalid format option', function () {
    Storage::fake('public');
    $admin = blogMediaAdminUser();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.media.store'), [
            'image' => UploadedFile::fake()->image('photo.jpg'),
            'format' => 'gif',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['format']);
});
