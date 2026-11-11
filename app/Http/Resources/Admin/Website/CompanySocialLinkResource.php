<?php

namespace App\Http\Resources\Admin\Website;

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
            'id' => $this->id,
            'company_profile_id' => $this->company_profile_id,
            'platform' => $this->platform?->value ?? $this->platform,
            'platform_label' => $this->platform?->label(),
            'url' => $this->url,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
