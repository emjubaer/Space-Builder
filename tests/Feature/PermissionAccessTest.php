<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

test('admin role receives all seeded permissions by default', function () {
    $admin = Role::findByName(UserRole::Admin->value, 'web');
    $permissionCount = Permission::query()->where('guard_name', 'web')->count();

    expect($admin->permissions)->toHaveCount($permissionCount)
        ->and($permissionCount)->toBeGreaterThan(10);
});

test('author role receives blog defaults by default', function () {
    $author = Role::findByName(UserRole::Author->value, 'web');

    expect($author->permissions->pluck('name')->sort()->values()->all())->toBe([
        'blog_category_view',
        'blog_create',
        'blog_delete',
        'blog_update',
        'blog_view',
        'dashboard_view',
        'notification_view',
    ]);
});

test('staff role receives no permissions by default', function () {
    $staff = Role::findByName(UserRole::Staff->value, 'web');

    expect($staff->permissions)->toHaveCount(0);
});

test('author can access blog pages but not users or properties', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Author);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.blogs.index'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.blogs.create'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.blogs.categories.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.properties.index'))
        ->assertForbidden();
});

test('custom role with only property_view can list properties but not create', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'property-viewer', 'guard_name' => 'web']);
    $role->givePermissionTo('property_view');
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('admin.properties.index'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('admin.properties.create'))
        ->assertForbidden();

    $this->actingAs($user)
        ->postJson(route('admin.properties.store'), [
            'title' => 'Blocked',
        ])
        ->assertForbidden();
});

test('auth user permissions are shared with inertia', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Author);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('auth.user.permissions')
            ->where('auth.user.permissions', fn ($permissions) => collect($permissions)->contains('blog_view'))
        );
});
