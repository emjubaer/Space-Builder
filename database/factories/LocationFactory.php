<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->city().' '.fake()->streetName(),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'area' => fake()->optional()->streetName(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'image' => null,
            'map_url' => null,
        ];
    }
}
