<?php

namespace App\Services\Admin;

use App\Enums\PropertyImageType;
use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PropertyService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Property
    {
        return DB::transaction(function () use ($data): Property {
            $slug = filled($data['slug'] ?? null)
                ? Property::generateUniqueSlug($data['slug'])
                : Property::generateUniqueSlug($data['title']);

            $property = Property::create([
                'location_id' => $data['location_id'],
                'property_type_id' => $data['property_type_id'],
                'title' => $data['title'],
                'slug' => $slug,
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'land_area' => $data['land_area'] ?? null,
                'land_area_unit' => $data['land_area_unit'] ?? null,
                'total_floors' => $data['total_floors'] ?? null,
                'apartments_per_floor' => $data['apartments_per_floor'] ?? null,
                'apartment_size' => $data['apartment_size'] ?? null,
                'bedrooms' => $data['bedrooms'] ?? null,
                'bathrooms' => $data['bathrooms'] ?? null,
                'launch_date' => $data['launch_date'] ?? null,
                'expected_completion_date' => $data['expected_completion_date'] ?? null,
                'status' => $data['status'] ?? PropertyStatus::Draft->value,
                'is_featured' => $this->toBoolean($data['is_featured'] ?? false),
                'is_published' => $this->toBoolean($data['is_published'] ?? false),
            ]);

            $this->syncFeatures($property, $data['feature_ids'] ?? []);
            $this->syncTypedImages($property, $data);

            return $property->refresh()->load([
                'location',
                'propertyType',
                'features',
                'images',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Property $property, array $data): Property
    {
        return DB::transaction(function () use ($property, $data): Property {
            $slug = filled($data['slug'] ?? null)
                ? Property::generateUniqueSlug($data['slug'], $property->id)
                : $property->slug;

            $property->update([
                'location_id' => $data['location_id'] ?? $property->location_id,
                'property_type_id' => $data['property_type_id'] ?? $property->property_type_id,
                'title' => $data['title'] ?? $property->title,
                'slug' => $slug,
                'short_description' => array_key_exists('short_description', $data)
                    ? $data['short_description']
                    : $property->short_description,
                'description' => array_key_exists('description', $data)
                    ? $data['description']
                    : $property->description,
                'land_area' => array_key_exists('land_area', $data) ? $data['land_area'] : $property->land_area,
                'land_area_unit' => array_key_exists('land_area_unit', $data)
                    ? $data['land_area_unit']
                    : $property->land_area_unit,
                'total_floors' => array_key_exists('total_floors', $data)
                    ? $data['total_floors']
                    : $property->total_floors,
                'apartments_per_floor' => array_key_exists('apartments_per_floor', $data)
                    ? $data['apartments_per_floor']
                    : $property->apartments_per_floor,
                'apartment_size' => array_key_exists('apartment_size', $data)
                    ? $data['apartment_size']
                    : $property->apartment_size,
                'bedrooms' => array_key_exists('bedrooms', $data) ? $data['bedrooms'] : $property->bedrooms,
                'bathrooms' => array_key_exists('bathrooms', $data) ? $data['bathrooms'] : $property->bathrooms,
                'launch_date' => array_key_exists('launch_date', $data)
                    ? $data['launch_date']
                    : $property->launch_date,
                'expected_completion_date' => array_key_exists('expected_completion_date', $data)
                    ? $data['expected_completion_date']
                    : $property->expected_completion_date,
                'status' => $data['status'] ?? $property->status,
                'is_featured' => array_key_exists('is_featured', $data)
                    ? $this->toBoolean($data['is_featured'])
                    : $property->is_featured,
                'is_published' => array_key_exists('is_published', $data)
                    ? $this->toBoolean($data['is_published'])
                    : $property->is_published,
            ]);

            if (array_key_exists('feature_ids', $data)) {
                $this->syncFeatures($property, $data['feature_ids'] ?? []);
            }

            $this->syncTypedImages($property, $data);

            return $property->refresh()->load([
                'location',
                'propertyType',
                'features',
                'images',
            ]);
        });
    }

    public function delete(Property $property): void
    {
        DB::transaction(function () use ($property): void {
            foreach ($property->images as $image) {
                $this->deleteImage($image->image_path);
                $image->delete();
            }

            $property->features()->detach();
            $property->delete();
        });
    }

    /**
     * @param  list<int|string>|mixed  $featureIds
     */
    public function syncFeatures(Property $property, mixed $featureIds): void
    {
        $ids = is_array($featureIds)
            ? array_values(array_unique(array_map('intval', $featureIds)))
            : [];

        $property->features()->sync($ids);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncTypedImages(Property $property, array $data): void
    {
        $this->syncImagesForType(
            $property,
            PropertyImageType::Cover,
            $this->normalizeFiles($data['cover_image'] ?? null),
            array_map('intval', $data['existing_cover_ids'] ?? []),
            'property-cover',
            single: true,
        );

        $this->syncImagesForType(
            $property,
            PropertyImageType::Gallery,
            $this->normalizeFiles($data['gallery_images'] ?? []),
            array_map('intval', $data['existing_gallery_ids'] ?? []),
            'property-gallery',
        );

        $this->syncImagesForType(
            $property,
            PropertyImageType::FloorPlan,
            $this->normalizeFiles($data['floor_plan_images'] ?? []),
            array_map('intval', $data['existing_floor_plan_ids'] ?? []),
            'property-floor-plans',
        );

        $this->syncImagesForType(
            $property,
            PropertyImageType::Tour,
            $this->normalizeFiles($data['tour_images'] ?? []),
            array_map('intval', $data['existing_tour_ids'] ?? []),
            'property-tour',
        );
    }

    /**
     * @param  list<UploadedFile>  $newFiles
     * @param  list<int>  $keepIds
     */
    private function syncImagesForType(
        Property $property,
        PropertyImageType $type,
        array $newFiles,
        array $keepIds,
        string $directory,
        bool $single = false,
    ): void {
        $existing = $property->images()
            ->where('image_type', $type)
            ->get();

        foreach ($existing as $image) {
            if (! in_array($image->id, $keepIds, true)) {
                $this->deleteImage($image->image_path);
                $image->delete();
            }
        }

        if ($single && $newFiles !== []) {
            $kept = $property->images()
                ->where('image_type', $type)
                ->get();

            foreach ($kept as $image) {
                $this->deleteImage($image->image_path);
                $image->delete();
            }
        }

        $sortOrder = (int) $property->images()->where('image_type', $type)->max('sort_order');

        foreach ($newFiles as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $sortOrder++;

            PropertyImage::create([
                'property_id' => $property->id,
                'image_path' => $this->storeImage($file, $directory),
                'image_type' => $type,
                'alt_text' => null,
                'caption' => null,
                'sort_order' => $sortOrder,
            ]);

            if ($single) {
                break;
            }
        }
    }

    /**
     * @return list<UploadedFile>
     */
    private function normalizeFiles(mixed $files): array
    {
        if ($files instanceof UploadedFile) {
            return [$files];
        }

        if (! is_array($files)) {
            return [];
        }

        return array_values(array_filter(
            $files,
            fn ($file) => $file instanceof UploadedFile,
        ));
    }

    private function storeImage(UploadedFile $image, string $directory): string
    {
        return $image->store($directory, 'public');
    }

    private function deleteImage(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
