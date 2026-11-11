<?php

namespace App\Http\Resources\Admin\Website;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin CompanyProfile
 */
class CompanyProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'logo' => $this->logo,
            'logo_url' => $this->logo ? Storage::disk('public')->url($this->logo) : null,
            'favicon' => $this->favicon,
            'favicon_url' => $this->favicon ? Storage::disk('public')->url($this->favicon) : null,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'website_url' => $this->website_url,
            'copyright_text' => $this->copyright_text,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'social_links' => $this->whenLoaded(
                'socialLinks',
                fn () => CompanySocialLinkResource::collection($this->socialLinks)->resolve(),
            ),
            'offices' => $this->whenLoaded(
                'offices',
                fn () => CompanyOfficeResource::collection($this->offices)->resolve(),
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
