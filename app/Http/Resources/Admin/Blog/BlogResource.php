<?php

namespace App\Http\Resources\Admin\Blog;

use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Blog
 */
class BlogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $coverImages = $this->relationLoaded('images')
            ? $this->images
                ->where('image_type', 'cover')
                ->values()
                ->map(fn ($image) => [
                    'id' => $image->id,
                    'path' => $image->image_path,
                    'url' => Storage::disk('public')->url($image->image_path),
                    'name' => basename($image->image_path),
                ])
            : [];

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'author_id' => $this->author_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'description' => $this->description,
            'html_content' => $this->html_content,
            'featured_image' => $this->featured_image,
            'featured_image_url' => $this->featured_image
                ? Storage::disk('public')->url($this->featured_image)
                : null,
            'featured_image_name' => $this->featured_image
                ? basename($this->featured_image)
                : null,
            'cover_images' => $coverImages,
            'reading_time' => $this->reading_time,
            'status' => $this->status?->value ?? $this->status,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => BlogCategoryResource::make($this->whenLoaded('category')),
            'author' => BlogAuthorResource::make($this->whenLoaded('author')),
        ];
    }
}
