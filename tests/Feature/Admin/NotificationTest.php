<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function notificationAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'notify-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot access notifications', function () {
    $this->getJson(route('admin.notifications.unread-count'))
        ->assertUnauthorized();
});

test('non admin users cannot access notifications', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->getJson(route('admin.notifications.unread-count'))
        ->assertForbidden();
});

test('admin can fetch unread notification count', function () {
    $this->actingAs(notificationAdminUser())
        ->getJson(route('admin.notifications.unread-count'))
        ->assertOk()
        ->assertJson([
            'count' => 0,
        ]);
});

test('admin can list notifications', function () {
    $this->actingAs(notificationAdminUser())
        ->getJson(route('admin.notifications.list'))
        ->assertOk()
        ->assertJsonStructure([
            'data',
        ]);
});
