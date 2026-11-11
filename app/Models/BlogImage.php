<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'blog_id',
    'blog_section_id',
    'image_path',
    'image_type',
    'alt_text',
    'caption',
    'sort_order',
])]
class BlogImage extends Model
{
    /**
     * @return BelongsTo<Blog, $this>
     */
    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class);
    }

    /**
     * @return BelongsTo<BlogSection, $this>
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(BlogSection::class, 'blog_section_id');
    }
}
