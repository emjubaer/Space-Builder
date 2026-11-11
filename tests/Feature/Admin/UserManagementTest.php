<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function adminUser(): User
{
    $user = User::factory()->create([
        'email' => 'admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit users page', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('login'));
});

test('non admin users cannot visit users page', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin can view users page', function () {
    $this->actingAs(adminUser())
        ->get(route('admin.users.index'))
        ->assertOk();
});

test('admin can list users', function () {
    $admin = adminUser();
    User::factory()->create(['email' => 'staff@example.com']);

    $this->actingAs($admin)
        ->getJson(route('admin.users.list'))
        ->assertOk()
        ->assertJsonStructure(['data']);
});

test('admin can create a user', function () {
    $admin = adminUser();
    $staffRoleId = Role::findByName(UserRole::Staff->value)->id;

    $this->actingAs($admin)
        ->postJson(route('admin.users.store'), [
            'name' => 'New Staff',
            'email' => 'new-staff@example.com',
            'mobile' => '01711112222',
            'password' => 'password',
            'password_confirmation' => 'password',
            'roles' => [$staffRoleId],
        ])
        ->assertCreated();

    $created = User::query()->where('email', 'new-staff@example.com')->first();

    expect($created)->not->toBeNull()
        ->and($created->hasRole(UserRole::Staff))->toBeTrue();
});

test('admin can update a user', function () {
    $admin = adminUser();
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'mobile' => '01733334444',
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.users.update', $user), [
            'name' => 'New Name',
            'email' => 'updated@example.com',
            'mobile' => '01755556666',
            'roles' => [],
        ])
        ->assertOk();

    expect($user->refresh()->name)->toBe('New Name')
        ->and($user->email)->toBe('updated@example.com');
});

test('admin can change a user password', function () {
    $admin = adminUser();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->postJson(route('admin.users.change-password', $user), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertOk();

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('admin cannot delete themselves', function () {
    $admin = adminUser();

    $this->actingAs($admin)
        ->deleteJson(route('admin.users.destroy', $admin))
        ->assertUnprocessable();
});

test('admin can delete another user', function () {
    $admin = adminUser();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->deleteJson(route('admin.users.destroy', $user))
        ->assertOk();

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});
