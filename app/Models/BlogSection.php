<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'blog_id',
    'section_type',
    'heading',
    'content',
    'sort_order',
])]
class BlogSection extends Model
{
    /**
     * @return BelongsTo<Blog, $this>
     */
    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class);
    }

    /**
     * @return HasMany<BlogImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(BlogImage::class)->orderBy('sort_order');
    }
}
