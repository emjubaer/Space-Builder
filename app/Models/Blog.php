<?php

namespace App\Models;

use App\Enums\BlogStatus;
use Database\Factories\BlogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'category_id',
    'author_id',
    'title',
    'slug',
    'excerpt',
    'description',
    'html_content',
    'featured_image',
    'reading_time',
    'status',
    'meta_title',
    'meta_description',
    'published_at',
])]
class Blog extends Model
{
    /** @use HasFactory<BlogFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => BlogStatus::class,
            'published_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<BlogCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'category_id');
    }

    /**
     * @return BelongsTo<BlogAuthor, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(BlogAuthor::class, 'author_id');
    }

    /**
     * @return HasMany<BlogSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(BlogSection::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<BlogImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(BlogImage::class)->orderBy('sort_order');
    }

    public function markAsDraft(): void
    {
        $this->update([
            'status' => BlogStatus::Draft,
        ]);
    }

    public function markAsPublished(): void
    {
        $this->update([
            'status' => BlogStatus::Published,
            'published_at' => $this->published_at ?? now(),
        ]);
    }

    public function isPublished(): bool
    {
        return $this->status === BlogStatus::Published;
    }

    public static function generateUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'post';
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

    public static function estimateReadingTime(?string $html): ?int
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $words = str_word_count(strip_tags($html));

        return max(1, (int) ceil($words / 200));
    }
}
