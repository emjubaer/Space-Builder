<?php

namespace Database\Factories;

use App\Enums\PropertyImageType;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PropertyImage>
 */
class PropertyImageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'image_path' => 'property-gallery/'.fake()->uuid().'.jpg',
            'image_type' => PropertyImageType::Gallery,
            'alt_text' => null,
            'caption' => null,
            'sort_order' => 0,
        ];
    }

    public function cover(): static
    {
        return $this->state(fn (array $attributes) => [
            'image_type' => PropertyImageType::Cover,
            'image_path' => 'property-cover/'.fake()->uuid().'.jpg',
        ]);
    }
}
