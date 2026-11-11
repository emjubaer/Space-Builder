<?php

namespace App\Http\Resources\Api;

use App\Models\CompanySocialLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CompanySocialLink
 */
class CompanySocialLinkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'platform' => $this->platform?->value ?? $this->platform,
            'platform_label' => $this->platform?->label(),
            'url' => $this->url,
            'sort_order' => $this->sort_order,
        ];
    }
}
