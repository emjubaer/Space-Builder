<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Models\ConstructionTask;
use App\Models\Property;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PropertyService
{
    /**
     * @return Collection<int, Property>
     */
    public function featured(int $limit): Collection
    {
        return $this->summaryQuery()
            ->featured()
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @return LengthAwarePaginator<int, Property>
     */
    public function paginate(
        int $limit,
        ?int $propertyTypeId = null,
        ?int $locationId = null,
        ?PropertyStatus $status = null,
    ): LengthAwarePaginator {
        return $this->summaryQuery()
            ->when($propertyTypeId !== null, fn (Builder $query) => $query->where('property_type_id', $propertyTypeId))
            ->when($locationId !== null, fn (Builder $query) => $query->where('location_id', $locationId))
            ->when($status !== null, fn (Builder $query) => $query->where('status', $status))
            ->orderByDesc('id')
            ->paginate($limit);
    }

    public function findPublishedBySlug(string $slug): Property
    {
        return $this->detailQuery()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /**
     * @return array{property: Property, overall_progress: float, tasks: Collection<int, ConstructionTask>}
     */
    public function constructionProgress(string $slug): array
    {
        $property = Property::query()
            ->published()
            ->with(['constructionTasks'])
            ->where('slug', $slug)
            ->firstOrFail();

        $tasks = $property->constructionTasks;
        $overallProgress = $tasks->isEmpty()
            ? 0.0
            : round((float) $tasks->avg('progress_percentage'), 2);

        return [
            'property' => $property,
            'overall_progress' => $overallProgress,
            'tasks' => $tasks,
        ];
    }

    /**
     * @return Builder<Property>
     */
    private function summaryQuery(): Builder
    {
        return Property::query()
            ->published()
            ->with([
                'location:id,name,city,area,address',
                'propertyType:id,name,slug',
                'coverImages:id,property_id,image_path,image_type,alt_text,caption,sort_order',
            ]);
    }

    /**
     * @return Builder<Property>
     */
    private function detailQuery(): Builder
    {
        return Property::query()
            ->published()
            ->with([
                'location:id,name,address,city,area,latitude,longitude,image,map_url',
                'propertyType:id,name,slug',
                'features:id,name,slug,icon,sort_order',
                'images:id,property_id,image_path,image_type,alt_text,caption,sort_order',
            ]);
    }
}
