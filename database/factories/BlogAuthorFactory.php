<?php

namespace Database\Factories;

use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogAuthor>
 */
class BlogAuthorFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->name();

        return [
            'user_id' => User::factory(),
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'bio' => fake()->optional()->paragraph(),
            'designation' => fake()->optional()->jobTitle(),
            'social_links' => null,
            'status' => true,
            'created_by' => null,
        ];
    }
}
