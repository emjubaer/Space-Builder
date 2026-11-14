<?php

namespace Database\Seeders;

use App\Enums\ConstructionTaskStatus;
use App\Models\Property;
use App\Services\Admin\ConstructionTaskService;
use Illuminate\Database\Seeder;

class ConstructionTaskSeeder extends Seeder
{
    /**
     * Seed demo construction phases for properties that have none.
     */
    public function run(): void
    {
        $service = app(ConstructionTaskService::class);

        $properties = Property::query()
            ->whereDoesntHave('constructionTasks')
            ->limit(5)
            ->get();

        if ($properties->isEmpty()) {
            return;
        }

        $sampleProgress = [100, 85, 60, 40, 25, 10, 0, 0, 0, 0];

        foreach ($properties as $property) {
            foreach (ConstructionTaskService::defaultPhases() as $index => $phase) {
                $progress = $sampleProgress[$index] ?? 0;

                $status = match (true) {
                    $progress >= 100 => ConstructionTaskStatus::Completed->value,
                    $progress > 0 => ConstructionTaskStatus::InProgress->value,
                    default => ConstructionTaskStatus::Pending->value,
                };

                $service->create($property, [
                    ...$phase,
                    'progress_percentage' => $progress,
                    'status' => $status,
                ]);
            }
        }
    }
}
