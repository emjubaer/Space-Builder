<?php

namespace App\Http\Resources\Admin\Property;

use App\Models\PropertyImage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin PropertyImage
 */
class PropertyImageResource extends JsonResource
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
            'path' => $this->image_path,
            'url' => $disk->url($this->image_path),
            'name' => basename($this->image_path),
            'image_type' => $this->image_type?->value ?? $this->image_type,
            'alt_text' => $this->alt_text,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
        ];
    }
}
