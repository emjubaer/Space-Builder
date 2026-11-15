<?php

namespace Database\Factories;

use App\Enums\ReferralSource;
use App\Enums\ReferralStatus;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Referral>
 */
class ReferralFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'referrer_id' => User::factory(),
            'referred_user_id' => null,
            'referred_name' => fake()->name(),
            'referred_phone' => fake()->numerify('01#########'),
            'note' => fake()->optional()->sentence(),
            'permission_confirmed' => fake()->boolean(),
            'status' => ReferralStatus::Unverified,
            'source' => ReferralSource::Manual,
            'converted_at' => null,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReferralStatus::Verified,
            'converted_at' => now(),
        ]);
    }

    public function fromLink(): static
    {
        return $this->state(fn (array $attributes) => [
            'source' => ReferralSource::Link,
        ]);
    }
}
