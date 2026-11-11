<?php

namespace App\Http\Resources\Admin\Blog;

use App\Models\BlogAuthor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin BlogAuthor
 */
class BlogAuthorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'slug' => $this->slug,
            'bio' => $this->bio,
            'designation' => $this->designation,
            'social_links' => $this->social_links,
            'status' => $this->status,
            'blogs_count' => $this->whenCounted('blogs'),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'avatar' => $this->user?->avatar
                    ? Storage::disk('public')->url($this->user->avatar)
                    : null,
            ]),
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
