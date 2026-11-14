<?php

namespace App\Models;

use App\Enums\TestimonialType;
use App\Enums\VideoProvider;
use Database\Factories\TestimonialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'created_by',
    'type',
    'is_active',
    'reviewer_name',
    'reviewer_position',
    'reviewer_company',
    'reviewer_avatar',
    'content',
    'rating',
    'video_provider',
    'video_id',
    'video_url',
    'sort_order',
    'published_at',
])]
class Testimonial extends Model
{
    /** @use HasFactory<TestimonialFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => TestimonialType::class,
            'is_active' => 'boolean',
            'rating' => 'integer',
            'sort_order' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param  Builder<Testimonial>  $query
     * @return Builder<Testimonial>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Testimonial>  $query
     * @return Builder<Testimonial>
     */
    public function scopeText(Builder $query): Builder
    {
        return $query->where('type', TestimonialType::Text);
    }

    /**
     * @param  Builder<Testimonial>  $query
     * @return Builder<Testimonial>
     */
    public function scopeVideo(Builder $query): Builder
    {
        return $query->where('type', TestimonialType::Video);
    }

    public function isVideo(): bool
    {
        return $this->type === TestimonialType::Video;
    }

    public function embedUrl(): ?string
    {
        $provider = $this->video_provider instanceof VideoProvider
            ? $this->video_provider->value
            : $this->video_provider;

        return match ($provider) {
            VideoProvider::Youtube->value => filled($this->video_id)
                ? "https://www.youtube.com/embed/{$this->video_id}"
                : null,
            VideoProvider::Vimeo->value => filled($this->video_id)
                ? "https://player.vimeo.com/video/{$this->video_id}"
                : null,
            VideoProvider::SelfHosted->value => $this->video_url,
            default => null,
        };
    }
}
