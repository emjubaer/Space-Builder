<?php

namespace Database\Factories;

use App\Enums\ConstructionTaskStatus;
use App\Models\ConstructionTask;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConstructionTask>
 */
class ConstructionTaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'status' => ConstructionTaskStatus::Pending,
            'progress_percentage' => 0,
            'sort_order' => 0,
        ];
    }

    public function inProgress(float $progress = 45): static
    {
        return $this->state(fn (): array => [
            'status' => ConstructionTaskStatus::InProgress,
            'progress_percentage' => $progress,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            'status' => ConstructionTaskStatus::Completed,
            'progress_percentage' => 100,
        ]);
    }
}
