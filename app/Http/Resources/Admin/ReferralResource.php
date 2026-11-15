<?php

namespace App\Http\Resources\Admin;

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
        $reward = $this->relationLoaded('rewards')
            ? $this->rewards->first()
            : null;

        return [
            'id' => $this->id,
            'referred_name' => $this->referred_name,
            'referred_phone' => $this->referred_phone,
            'note' => $this->note,
            'permission_confirmed' => $this->permission_confirmed,
            'status' => $this->status?->value ?? $this->status,
            'source' => $this->source?->value ?? $this->source,
            'submitted_at' => $this->created_at,
            'converted_at' => $this->converted_at,
            'referrer' => $this->whenLoaded('referrer', fn () => [
                'id' => $this->referrer?->id,
                'name' => $this->referrer?->name,
                'email' => $this->referrer?->email,
                'mobile' => $this->referrer?->mobile,
            ]),
            'reward' => $this->when(
                $this->relationLoaded('rewards'),
                fn () => $reward === null ? null : [
                    'id' => $reward->id,
                    'amount' => $reward->amount,
                    'status' => $reward->status?->value ?? $reward->status,
                    'earned_at' => $reward->earned_at,
                ],
            ),
        ];
    }
}
