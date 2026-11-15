<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class ReferrerReferralGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'referrer' => [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $this->email,
                'mobile' => $this->mobile,
            ],
            'referrals_count' => (int) ($this->referrals_count ?? 0),
            'verified_count' => (int) ($this->verified_count ?? 0),
            'referrals' => ReferralResource::collection(
                $this->whenLoaded('referralsSubmitted'),
            ),
        ];
    }
}
