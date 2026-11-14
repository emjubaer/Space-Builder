<?php

namespace App\Models;

use App\Enums\PropertyImageType;
use App\Enums\PropertyStatus;
use Database\Factories\PropertyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

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
    /** @use HasFactory<PropertyFactory> */
    use HasFactory;

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
     * @return HasMany<PropertyImage, $this>
     */
    public function coverImages(): HasMany
    {
        return $this->hasMany(PropertyImage::class)
            ->where('image_type', PropertyImageType::Cover)
            ->orderBy('sort_order');
    }

    /**
     * @return HasMany<PropertyImage, $this>
     */
    public function galleryImages(): HasMany
    {
        return $this->hasMany(PropertyImage::class)
            ->where('image_type', PropertyImageType::Gallery)
            ->orderBy('sort_order');
    }

    /**
     * @return HasMany<PropertyImage, $this>
     */
    public function floorPlanImages(): HasMany
    {
        return $this->hasMany(PropertyImage::class)
            ->where('image_type', PropertyImageType::FloorPlan)
            ->orderBy('sort_order');
    }

    /**
     * @return HasMany<PropertyImage, $this>
     */
    public function tourImages(): HasMany
    {
        return $this->hasMany(PropertyImage::class)
            ->where('image_type', PropertyImageType::Tour)
            ->orderBy('sort_order');
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

    public static function generateUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'property';
        $slug = $base;
        $suffix = 1;

        while (static::query()
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }

    #[Scope]
    protected function featured(Builder $query): void
    {
        $query->where('is_featured', true);
    }
}
