<?php

namespace App\Http\Resources\Admin\Website;

use App\Models\Testimonial;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Testimonial
 */
class TestimonialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return [
            'id' => $this->id,
            'type' => $this->type?->value ?? $this->type,
            'is_active' => $this->is_active,
            'reviewer_name' => $this->reviewer_name,
            'reviewer_position' => $this->reviewer_position,
            'reviewer_company' => $this->reviewer_company,
            'reviewer_avatar' => $this->reviewer_avatar,
            'reviewer_avatar_url' => $this->reviewer_avatar
                ? $disk->url($this->reviewer_avatar)
                : null,
            'content' => $this->content,
            'rating' => $this->rating,
            'video_provider' => $this->video_provider,
            'video_id' => $this->video_id,
            'video_url' => $this->video_url,
            'embed_url' => $this->embedUrl(),
            'sort_order' => $this->sort_order,
            'published_at' => $this->published_at,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
