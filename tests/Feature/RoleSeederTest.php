<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Spatie\Permission\Models\Role;

test('role seeder creates admin author and staff roles', function () {
    $this->seed(RoleSeeder::class);

    foreach (UserRole::cases() as $role) {
        expect(Role::findByName($role->value, 'web'))->not->toBeNull();
    }
});

test('users can be assigned a user role', function () {
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole(UserRole::Admin);

    expect($user->hasRole(UserRole::Admin))->toBeTrue();
});
