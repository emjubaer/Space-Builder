<?php

namespace Database\Factories;

use App\Enums\TestimonialType;
use App\Enums\VideoProvider;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Testimonial>
 */
class TestimonialFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'type' => TestimonialType::Text,
            'is_active' => true,
            'reviewer_name' => fake()->name(),
            'reviewer_position' => fake()->optional()->jobTitle(),
            'reviewer_company' => fake()->optional()->company(),
            'reviewer_avatar' => null,
            'content' => fake()->paragraph(),
            'rating' => fake()->numberBetween(1, 5),
            'video_provider' => null,
            'video_id' => null,
            'video_url' => null,
            'sort_order' => 0,
            'published_at' => now(),
        ];
    }

    public function video(): static
    {
        return $this->state(fn (): array => [
            'type' => TestimonialType::Video,
            'content' => null,
            'rating' => null,
            'video_provider' => VideoProvider::Youtube->value,
            'video_id' => 'dQw4w9WgXcQ',
            'video_url' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }
}
