<?php

namespace App\Http\Resources\Api;

use App\Models\BlogImage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin BlogImage
 */
class BlogCoverImageResource extends JsonResource
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
            'url' => $disk->url($this->image_path),
            'alt_text' => $this->alt_text,
            'caption' => $this->caption,
        ];
    }
}
