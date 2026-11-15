<?php

namespace App\Http\Requests\Admin\Property;

use App\Enums\PropertyStatus;
use App\Models\Location;
use App\Models\PropertyFeature;
use App\Models\PropertyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('property_create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $nullable = [
            'slug',
            'short_description',
            'description',
            'land_area',
            'land_area_unit',
            'total_floors',
            'apartments_per_floor',
            'apartment_size',
            'bedrooms',
            'bathrooms',
            'launch_date',
            'expected_completion_date',
        ];

        $payload = [];

        foreach ($nullable as $field) {
            if ($this->exists($field) && $this->input($field) === '') {
                $payload[$field] = null;
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'location_id' => ['required', 'integer', Rule::exists(Location::class, 'id')],
            'property_type_id' => ['required', 'integer', Rule::exists(PropertyType::class, 'id')],
            'land_area' => ['nullable', 'numeric', 'min:0'],
            'land_area_unit' => ['nullable', 'string', 'max:50'],
            'total_floors' => ['nullable', 'integer', 'min:0'],
            'apartments_per_floor' => ['nullable', 'integer', 'min:0'],
            'apartment_size' => ['nullable', 'numeric', 'min:0'],
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'launch_date' => ['nullable', 'date'],
            'expected_completion_date' => ['nullable', 'date', 'after_or_equal:launch_date'],
            'status' => ['required', Rule::enum(PropertyStatus::class)],
            'is_featured' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'feature_ids' => ['nullable', 'array'],
            'feature_ids.*' => ['integer', Rule::exists(PropertyFeature::class, 'id')],
            'cover_image' => ['nullable', 'image', 'max:10240'],
            'gallery_images' => ['nullable', 'array'],
            'gallery_images.*' => ['image', 'max:10240'],
            'floor_plan_images' => ['nullable', 'array'],
            'floor_plan_images.*' => ['image', 'max:10240'],
            'tour_images' => ['nullable', 'array'],
            'tour_images.*' => ['image', 'max:10240'],
        ];
    }
}
