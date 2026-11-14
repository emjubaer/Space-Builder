<?php

namespace App\Http\Resources\Api;

use App\Models\Blog;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Blog
 */
class BlogSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'description' => $this->description,
            'featured_image_url' => $this->publicUrl($this->featured_image),
            'cover_images' => $this->whenLoaded(
                'coverImages',
                fn () => BlogCoverImageResource::collection($this->coverImages)->resolve(),
            ),
            'reading_time' => $this->reading_time,
            'published_at' => $this->published_at,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ]),
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author?->id,
                'name' => $this->author?->user?->name,
                'slug' => $this->author?->slug,
                'avatar_url' => $this->publicUrl($this->author?->user?->avatar),
            ]),
        ];
    }

    private function publicUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($path);
    }
}
