<?php

namespace App\Http\Resources\Api\Property;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Property
 */
class PropertySummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cover = $this->relationLoaded('coverImages')
            ? $this->coverImages->first()
            : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'status' => $this->status?->value ?? $this->status,
            'land_area' => $this->land_area,
            'land_area_unit' => $this->land_area_unit,
            'total_floors' => $this->total_floors,
            'apartments_per_floor' => $this->apartments_per_floor,
            'apartment_size' => $this->apartment_size,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'launch_date' => $this->launch_date?->toDateString(),
            'expected_completion_date' => $this->expected_completion_date?->toDateString(),
            'is_featured' => $this->is_featured,
            'location' => $this->whenLoaded(
                'location',
                fn () => $this->location
                    ? (new PropertyLocationResource($this->location))->resolve()
                    : null,
            ),
            'property_type' => $this->whenLoaded(
                'propertyType',
                fn () => (new PropertyTypeResource($this->propertyType))->resolve(),
            ),
            'cover_image' => $cover
                ? (new PropertyImageResource($cover))->resolve()
                : null,
        ];
    }
}
