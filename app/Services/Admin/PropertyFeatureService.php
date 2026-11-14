<?php

namespace App\Services\Admin;

use App\Models\PropertyFeature;
use Illuminate\Validation\ValidationException;

class PropertyFeatureService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PropertyFeature
    {
        $slug = filled($data['slug'] ?? null)
            ? PropertyFeature::generateUniqueSlug($data['slug'])
            : PropertyFeature::generateUniqueSlug($data['name']);

        return PropertyFeature::create([
            'name' => $data['name'],
            'slug' => $slug,
            'icon' => $data['icon'] ?? null,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : true,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PropertyFeature $feature, array $data): PropertyFeature
    {
        $slug = filled($data['slug'] ?? null)
            ? PropertyFeature::generateUniqueSlug($data['slug'], $feature->id)
            : $feature->slug;

        $feature->update([
            'name' => $data['name'],
            'slug' => $slug,
            'icon' => array_key_exists('icon', $data) ? $data['icon'] : $feature->icon,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : $feature->is_active,
            'sort_order' => array_key_exists('sort_order', $data)
                ? (int) $data['sort_order']
                : $feature->sort_order,
        ]);

        return $feature->refresh();
    }

    public function delete(PropertyFeature $feature): void
    {
        if ($feature->hasProperties()) {
            throw ValidationException::withMessages([
                'feature' => __('Feature is assigned to properties and cannot be deleted.'),
            ]);
        }

        $feature->delete();
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
