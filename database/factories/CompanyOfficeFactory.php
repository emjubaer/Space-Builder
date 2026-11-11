<?php

namespace Database\Factories;

use App\Models\CompanyOffice;
use App\Models\CompanyProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyOffice>
 */
class CompanyOfficeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_profile_id' => CompanyProfile::factory(),
            'name' => fake()->city().' Office',
            'address' => fake()->address(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'is_head_office' => false,
            'latitude' => fake()->optional()->latitude(),
            'longitude' => fake()->optional()->longitude(),
        ];
    }

    public function headOffice(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_head_office' => true,
            'name' => 'Head Office',
        ]);
    }
}
