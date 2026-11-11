<?php

namespace Database\Factories;

use App\Enums\BlogStatus;
use App\Models\Blog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Blog>
 */
class BlogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'category_id' => BlogCategory::factory(),
            'author_id' => BlogAuthor::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numerify('###'),
            'excerpt' => null,
            'description' => fake()->sentence(),
            'html_content' => '<p>'.fake()->paragraph().'</p>',
            'featured_image' => null,
            'reading_time' => 1,
            'status' => BlogStatus::Draft,
            'meta_title' => null,
            'meta_description' => null,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BlogStatus::Published,
            'published_at' => now(),
        ]);
    }
}
