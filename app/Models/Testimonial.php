<?php

namespace App\Models;

use App\Enums\TestimonialType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
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
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => TestimonialType::class,
            'is_active' => 'boolean',
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
}
