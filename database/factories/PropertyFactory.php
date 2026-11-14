<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'location_id' => Location::factory(),
            'property_type_id' => PropertyType::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numerify('###'),
            'short_description' => fake()->optional()->sentence(),
            'description' => fake()->optional()->paragraph(),
            'land_area' => fake()->optional()->randomFloat(2, 1, 50),
            'land_area_unit' => 'katha',
            'total_floors' => fake()->optional()->numberBetween(1, 20),
            'apartments_per_floor' => fake()->optional()->numberBetween(1, 8),
            'apartment_size' => fake()->optional()->randomFloat(2, 800, 3000),
            'bedrooms' => fake()->optional()->numberBetween(1, 5),
            'bathrooms' => fake()->optional()->numberBetween(1, 4),
            'launch_date' => null,
            'expected_completion_date' => null,
            'status' => PropertyStatus::Draft,
            'is_featured' => false,
            'is_published' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PropertyStatus::Ongoing,
            'is_published' => true,
        ]);
    }

    public function featured(): static
    {
        return $this->published()->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
