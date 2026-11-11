<?php

namespace Database\Factories;

use App\Enums\SocialPlatform;
use App\Models\CompanyProfile;
use App\Models\CompanySocialLink;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanySocialLink>
 */
class CompanySocialLinkFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_profile_id' => CompanyProfile::factory(),
            'platform' => fake()->randomElement(SocialPlatform::cases()),
            'url' => fake()->url(),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
