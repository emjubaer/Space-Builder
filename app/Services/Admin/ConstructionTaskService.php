<?php

namespace App\Services\Admin;

use App\Enums\ConstructionTaskStatus;
use App\Models\ConstructionTask;
use App\Models\Property;
use Illuminate\Support\Collection;

class ConstructionTaskService
{
    /**
     * @return list<array{title: string, description: string|null, sort_order: int}>
     */
    public static function defaultPhases(): array
    {
        $titles = [
            'Site Preparation',
            'Foundation Work',
            'Structural Framework',
            'Brick Work / Walls',
            'Roofing',
            'Plumbing & Electrical',
            'Interior Finishing',
            'Exterior Finishing',
            'Utility Connections',
            'Handover / Snagging',
        ];

        return collect($titles)
            ->values()
            ->map(fn (string $title, int $index) => [
                'title' => $title,
                'description' => null,
                'sort_order' => $index + 1,
            ])
            ->all();
    }

    /**
     * @return Collection<int, ConstructionTask>
     */
    public function listForProperty(Property $property): Collection
    {
        return $property->constructionTasks()->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Property $property, array $data): ConstructionTask
    {
        $task = new ConstructionTask([
            'property_id' => $property->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? ConstructionTaskStatus::Pending->value,
            'progress_percentage' => $data['progress_percentage'] ?? 0,
            'sort_order' => $data['sort_order'] ?? $this->nextSortOrder($property),
        ]);

        if (! array_key_exists('status', $data) || $data['status'] === null) {
            $task->syncStatusFromProgress();
        }

        $task->save();

        return $task->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ConstructionTask $task, array $data): ConstructionTask
    {
        $task->fill([
            'title' => $data['title'] ?? $task->title,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $task->description,
            'progress_percentage' => array_key_exists('progress_percentage', $data)
                ? $data['progress_percentage']
                : $task->progress_percentage,
            'sort_order' => array_key_exists('sort_order', $data)
                ? $data['sort_order']
                : $task->sort_order,
        ]);

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $task->status = $data['status'];
        } else {
            $task->syncStatusFromProgress();
        }

        $task->save();

        return $task->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateProgress(ConstructionTask $task, array $data): ConstructionTask
    {
        $task->progress_percentage = $data['progress_percentage'];

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $task->status = $data['status'];
        } else {
            $task->syncStatusFromProgress();
        }

        $task->save();

        return $task->refresh();
    }

    public function delete(ConstructionTask $task): void
    {
        $task->delete();
    }

    /**
     * @return Collection<int, ConstructionTask>
     */
    public function applyDefaults(Property $property): Collection
    {
        $existingTitles = $property->constructionTasks()
            ->pluck('title')
            ->map(fn (string $title) => mb_strtolower($title))
            ->all();

        foreach (self::defaultPhases() as $phase) {
            if (in_array(mb_strtolower($phase['title']), $existingTitles, true)) {
                continue;
            }

            $this->create($property, $phase);
        }

        return $this->listForProperty($property->refresh());
    }

    private function nextSortOrder(Property $property): int
    {
        return ((int) $property->constructionTasks()->max('sort_order')) + 1;
    }
}
