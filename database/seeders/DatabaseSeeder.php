<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            PropertyTypeSeeder::class,
            PropertyFeatureSeeder::class,
            ConstructionTaskSeeder::class,
        ]);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'mobile' => '01700000001',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        $admin->assignRole(UserRole::Admin);
    }
}
