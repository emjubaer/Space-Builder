<?php

namespace App\Services;

use App\Enums\ReferralRewardStatus;
use App\Enums\ReferralSource;
use App\Enums\ReferralStatus;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ReferralService
{
    /**
     * @param  array{referred_name: string, referred_phone: string, note?: string|null, permission_confirmed: bool}  $data
     */
    public function create(User $referrer, array $data, ReferralSource $source): Referral
    {
        $exists = Referral::query()
            ->where('referred_phone', $data['referred_phone'])
            ->where('created_at', '>=', now()->subMonths(2))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'referred_phone' => __('This phone number was already referred within the last 2 months.'),
            ]);
        }

        return Referral::query()->create([
            'referrer_id' => $referrer->id,
            'referred_name' => $data['referred_name'],
            'referred_phone' => $data['referred_phone'],
            'note' => $data['note'] ?? null,
            'permission_confirmed' => (bool) $data['permission_confirmed'],
            'status' => ReferralStatus::Unverified,
            'source' => $source,
        ]);
    }

    /**
     * @param  array{referred_name: string, referred_phone: string, note?: string|null, permission_confirmed: bool}  $data
     *
     * @throws ModelNotFoundException
     */
    public function createFromCode(string $referralCode, array $data): Referral
    {
        $referrer = User::query()
            ->where('referral_code', $referralCode)
            ->firstOrFail();

        return $this->create($referrer, $data, ReferralSource::Link);
    }

    /**
     * @return array{
     *     user: array{id: int, name: string|null},
     *     referrals: Collection<int, Referral>
     * }
     */
    public function listFor(User $user): array
    {
        $referrals = $user->referralsSubmitted()
            ->latest('created_at')
            ->get();

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'referrals' => $referrals,
        ];
    }

    /**
     * @return array{
     *     user: array{
     *         id: int,
     *         name: string|null,
     *         email: string,
     *         mobile: string|null,
     *         referral_link: string|null
     *     },
     *     stats: array{
     *         total_referrals: int,
     *         total_successful: int,
     *         total_in_progress: int,
     *         total_rewards_earned: float|int
     *     }
     * }
     */
    public function summaryFor(User $user): array
    {
        $referrals = $user->referralsSubmitted()->get(['id', 'status']);

        $successful = $referrals
            ->where('status', ReferralStatus::Verified)
            ->count();

        $inProgress = $referrals
            ->where('status', ReferralStatus::Unverified)
            ->count();

        $totalRewards = (float) $user->referralsSubmitted()
            ->join('referral_rewards', 'referral_rewards.referral_id', '=', 'referrals.id')
            ->whereIn('referral_rewards.status', [
                ReferralRewardStatus::Earned->value,
                ReferralRewardStatus::Paid->value,
            ])
            ->sum('referral_rewards.amount');

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'referral_link' => $user->referralLink(),
            ],
            'stats' => [
                'total_referrals' => $referrals->count(),
                'total_successful' => $successful,
                'total_in_progress' => $inProgress,
                'total_rewards_earned' => $totalRewards,
            ],
        ];
    }
}
