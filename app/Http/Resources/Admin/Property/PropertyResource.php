<?php

namespace App\Http\Resources\Admin\Property;

use App\Enums\PropertyImageType;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Property
 */
class PropertyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imagesByType = $this->relationLoaded('images')
            ? $this->images->groupBy(fn ($image) => $image->image_type?->value ?? $image->image_type)
            : collect();

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'property_type_id' => $this->property_type_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'land_area' => $this->land_area,
            'land_area_unit' => $this->land_area_unit,
            'total_floors' => $this->total_floors,
            'apartments_per_floor' => $this->apartments_per_floor,
            'apartment_size' => $this->apartment_size,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'launch_date' => $this->launch_date?->toDateString(),
            'expected_completion_date' => $this->expected_completion_date?->toDateString(),
            'status' => $this->status?->value ?? $this->status,
            'is_featured' => $this->is_featured,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'location' => $this->whenLoaded(
                'location',
                fn () => (new LocationResource($this->location))->resolve(),
            ),
            'property_type' => $this->whenLoaded(
                'propertyType',
                fn () => (new PropertyTypeResource($this->propertyType))->resolve(),
            ),
            'features' => $this->whenLoaded(
                'features',
                fn () => PropertyFeatureResource::collection($this->features)->resolve(),
            ),
            'feature_ids' => $this->whenLoaded(
                'features',
                fn () => $this->features->pluck('id')->values()->all(),
            ),
            'cover_image' => $this->when(
                $this->relationLoaded('images'),
                function () use ($imagesByType) {
                    $cover = $imagesByType->get(PropertyImageType::Cover->value)?->first();

                    return $cover
                        ? (new PropertyImageResource($cover))->resolve()
                        : null;
                },
            ),
            'gallery_images' => $this->when(
                $this->relationLoaded('images'),
                fn () => PropertyImageResource::collection(
                    $imagesByType->get(PropertyImageType::Gallery->value, collect())->values(),
                )->resolve(),
            ),
            'floor_plan_images' => $this->when(
                $this->relationLoaded('images'),
                fn () => PropertyImageResource::collection(
                    $imagesByType->get(PropertyImageType::FloorPlan->value, collect())->values(),
                )->resolve(),
            ),
            'tour_images' => $this->when(
                $this->relationLoaded('images'),
                fn () => PropertyImageResource::collection(
                    $imagesByType->get(PropertyImageType::Tour->value, collect())->values(),
                )->resolve(),
            ),
        ];
    }
}
