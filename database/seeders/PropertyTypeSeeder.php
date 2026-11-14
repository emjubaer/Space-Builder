<?php

namespace Database\Seeders;

use App\Models\PropertyType;
use Illuminate\Database\Seeder;

class PropertyTypeSeeder extends Seeder
{
    /**
     * Seed common property types.
     */
    public function run(): void
    {
        $types = [
            ['slug' => 'residential', 'name' => 'Residential'],
            ['slug' => 'commercial', 'name' => 'Commercial'],
            ['slug' => 'industrial', 'name' => 'Industrial'],
        ];

        foreach ($types as $type) {
            PropertyType::query()->updateOrCreate(
                ['slug' => $type['slug']],
                [
                    'name' => $type['name'],
                    'is_active' => true,
                ],
            );
        }
    }
}
