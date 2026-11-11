<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Seed application permissions and attach them to admin.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'user_view',
            'user_create',
            'user_update',
            'user_delete',
            'role_view',
            'role_create',
            'role_update',
            'role_delete',
            'permission_view',
            'notification_view',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $admin = Role::findByName(UserRole::Admin->value, 'web');
        $admin->syncPermissions($permissions);
    }
}
