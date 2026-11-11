<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function roleAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'role-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit role page', function () {
    $this->get(route('admin.role.index'))->assertRedirect(route('login'));
});

test('non admin users cannot visit role page', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.role.index'))
        ->assertForbidden();
});

test('admin can view role page', function () {
    $this->actingAs(roleAdminUser())
        ->get(route('admin.role.index'))
        ->assertOk();
});

test('admin can view permission page', function () {
    $this->actingAs(roleAdminUser())
        ->get(route('admin.permission.index'))
        ->assertOk();
});

test('role list includes permissions without n plus one queries', function () {
    $admin = roleAdminUser();
    $permission = Permission::query()->firstOrFail();

    $custom = Role::create(['name' => 'custom-role', 'guard_name' => 'web']);
    $custom->givePermissionTo($permission);

    DB::enableQueryLog();

    $response = $this->actingAs($admin)
        ->getJson(route('admin.role.list'))
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'name',
                    'permissions' => [
                        [
                            'id',
                            'name',
                        ],
                    ],
                ],
            ],
        ]);

    $queries = collect(DB::getQueryLog());
    $permissionRelationQueries = $queries->filter(function (array $query): bool {
        $sql = strtolower($query['query']);

        return str_contains($sql, 'role_has_permissions')
            || (str_contains($sql, 'from `permissions`') && str_contains($sql, 'inner join'));
    });

    expect($permissionRelationQueries->count())->toBeLessThanOrEqual(2);

    $customRole = collect($response->json('data'))->firstWhere('name', 'custom-role');

    expect($customRole)->not->toBeNull()
        ->and($customRole['permissions'])->not->toBeEmpty();
});

test('admin can create a role with permissions', function () {
    $admin = roleAdminUser();
    $permissionIds = Permission::query()->take(2)->pluck('id')->all();

    $this->actingAs($admin)
        ->postJson(route('admin.role.store'), [
            'name' => 'editor',
            'permissions' => $permissionIds,
        ])
        ->assertCreated();

    $role = Role::findByName('editor', 'web');

    expect($role->permissions)->toHaveCount(2);
});

test('admin cannot delete protected roles', function () {
    $admin = roleAdminUser();
    $role = Role::findByName(UserRole::Staff->value, 'web');

    $this->actingAs($admin)
        ->deleteJson(route('admin.role.destroy', $role))
        ->assertUnprocessable();
});

test('admin can list permissions', function () {
    $this->actingAs(roleAdminUser())
        ->getJson(route('admin.permission.list'))
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'name',
                ],
            ],
        ]);
});
