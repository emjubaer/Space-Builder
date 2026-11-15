<?php

namespace App\Services\Admin;

use App\Enums\ReferralRewardStatus;
use App\Enums\ReferralStatus;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralService
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginate(Request $request): LengthAwarePaginator
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        return User::query()
            ->select(['id', 'name', 'email', 'mobile'])
            ->whereHas('referralsSubmitted', function ($query) use ($status): void {
                $query->when($status !== '', fn ($inner) => $inner->where('status', $status));
            })
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhereHas('referralsSubmitted', function ($referral) use ($search): void {
                            $referral->where('referred_name', 'like', "%{$search}%")
                                ->orWhere('referred_phone', 'like', "%{$search}%")
                                ->orWhere('note', 'like', "%{$search}%");
                        });
                });
            })
            ->withCount([
                'referralsSubmitted as referrals_count' => function ($query) use ($status): void {
                    $query->when($status !== '', fn ($inner) => $inner->where('status', $status));
                },
                'referralsSubmitted as verified_count' => function ($query): void {
                    $query->where('status', ReferralStatus::Verified);
                },
            ])
            ->with([
                'referralsSubmitted' => function ($query) use ($status): void {
                    $query->with('rewards')
                        ->when($status !== '', fn ($inner) => $inner->where('status', $status))
                        ->latest('created_at');
                },
            ])
            ->orderByDesc(
                Referral::query()
                    ->select('created_at')
                    ->whereColumn('referrer_id', 'users.id')
                    ->latest('created_at')
                    ->limit(1),
            )
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));
    }

    public function updateStatus(
        Referral $referral,
        ReferralStatus $status,
        ?string $rewardAmount = null,
    ): Referral {
        return DB::transaction(function () use ($referral, $status, $rewardAmount): Referral {
            $referral->update([
                'status' => $status,
                'converted_at' => $status === ReferralStatus::Verified ? now() : null,
            ]);

            if ($rewardAmount !== null) {
                $payload = [
                    'amount' => $rewardAmount,
                    'status' => $status === ReferralStatus::Verified
                        ? ReferralRewardStatus::Earned
                        : ReferralRewardStatus::Pending,
                    'earned_at' => $status === ReferralStatus::Verified ? now() : null,
                ];

                $reward = $referral->rewards()->first();

                if ($reward !== null) {
                    $reward->update($payload);
                } else {
                    $referral->rewards()->create($payload);
                }
            }

            return $referral->refresh()->load([
                'referrer:id,name,email,mobile',
                'rewards',
            ]);
        });
    }
}
