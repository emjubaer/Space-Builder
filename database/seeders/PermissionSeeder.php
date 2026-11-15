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
     * Seed application permissions and attach defaults to system roles.
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
            'dashboard_view',
            'property_view',
            'property_create',
            'property_update',
            'property_delete',
            'property_feature_view',
            'property_feature_create',
            'property_feature_update',
            'property_feature_delete',
            'property_type_view',
            'property_type_create',
            'property_type_update',
            'property_type_delete',
            'location_view',
            'location_create',
            'location_update',
            'location_delete',
            'blog_view',
            'blog_create',
            'blog_update',
            'blog_delete',
            'blog_category_view',
            'blog_category_create',
            'blog_category_update',
            'blog_category_delete',
            'blog_author_view',
            'blog_author_create',
            'blog_author_update',
            'blog_author_delete',
            'referral_view',
            'referral_update',
            'contact_view',
            'contact_update',
            'contact_delete',
            'newsletter_view',
            'newsletter_update',
            'newsletter_delete',
            'testimonial_view',
            'testimonial_create',
            'testimonial_update',
            'testimonial_delete',
            'company_profile_view',
            'company_profile_update',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $admin = Role::findByName(UserRole::Admin->value, 'web');
        $admin->syncPermissions($permissions);

        $author = Role::findByName(UserRole::Author->value, 'web');
        $author->syncPermissions([
            'dashboard_view',
            'notification_view',
            'blog_view',
            'blog_create',
            'blog_update',
            'blog_delete',
            'blog_category_view',
        ]);
    }
}
