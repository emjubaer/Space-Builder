<?php

namespace App\Http\Resources\Api;

use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Referral
 */
class ReferralResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referred_name' => $this->referred_name,
            'referred_phone' => $this->referred_phone,
            'submitted_at' => $this->created_at,
            'status' => $this->status?->value ?? $this->status,
            'source' => $this->source?->value ?? $this->source,
            'note' => $this->note,
        ];
    }
}
