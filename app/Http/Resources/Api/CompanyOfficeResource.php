<?php

namespace App\Http\Resources\Api;

use App\Models\CompanyOffice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CompanyOffice
 */
class CompanyOfficeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'is_head_office' => $this->is_head_office,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}
