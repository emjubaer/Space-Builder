<?php

namespace App\Services\Admin;

use App\Models\PropertyType;
use Illuminate\Validation\ValidationException;

class PropertyTypeService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PropertyType
    {
        $slug = filled($data['slug'] ?? null)
            ? PropertyType::generateUniqueSlug($data['slug'])
            : PropertyType::generateUniqueSlug($data['name']);

        return PropertyType::create([
            'name' => $data['name'],
            'slug' => $slug,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PropertyType $type, array $data): PropertyType
    {
        $slug = filled($data['slug'] ?? null)
            ? PropertyType::generateUniqueSlug($data['slug'], $type->id)
            : $type->slug;

        $type->update([
            'name' => $data['name'],
            'slug' => $slug,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : $type->is_active,
        ]);

        return $type->refresh();
    }

    public function delete(PropertyType $type): void
    {
        if ($type->hasProperties()) {
            throw ValidationException::withMessages([
                'type' => __('Property type has properties and cannot be deleted.'),
            ]);
        }

        $type->delete();
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
