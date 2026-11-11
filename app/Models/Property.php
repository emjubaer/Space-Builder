<?php

namespace App\Models;

use App\Enums\PropertyStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'location_id',
    'property_type_id',
    'title',
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
    'status',
    'is_featured',
    'is_published',
])]
class Property extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'land_area' => 'decimal:2',
            'apartment_size' => 'decimal:2',
            'launch_date' => 'date',
            'expected_completion_date' => 'date',
            'status' => PropertyStatus::class,
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * @return BelongsTo<PropertyType, $this>
     */
    public function propertyType(): BelongsTo
    {
        return $this->belongsTo(PropertyType::class);
    }

    /**
     * @return HasMany<PropertyImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    /**
     * @return BelongsToMany<PropertyFeature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(PropertyFeature::class, 'property_feature_property');
    }

    /**
     * @return HasMany<ConstructionTask, $this>
     */
    public function constructionTasks(): HasMany
    {
        return $this->hasMany(ConstructionTask::class)->orderBy('sort_order');
    }
}
