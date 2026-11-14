<?php

namespace App\Http\Resources\Api;

use App\Enums\TestimonialType;
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

        $base = [
            'id' => $this->id,
            'type' => $this->type?->value ?? $this->type,
            'reviewer_name' => $this->reviewer_name,
            'reviewer_position' => $this->reviewer_position,
            'reviewer_company' => $this->reviewer_company,
            'reviewer_avatar_url' => $this->reviewer_avatar
                ? $disk->url($this->reviewer_avatar)
                : null,
            'sort_order' => $this->sort_order,
        ];

        if ($this->type === TestimonialType::Video) {
            return [
                ...$base,
                'video_provider' => $this->video_provider,
                'video_id' => $this->video_id,
                'video_url' => $this->video_url,
                'embed_url' => $this->embedUrl(),
            ];
        }

        return [
            ...$base,
            'content' => $this->content,
            'rating' => $this->rating,
        ];
    }
}
