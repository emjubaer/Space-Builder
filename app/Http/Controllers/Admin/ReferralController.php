<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReferralStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateReferralStatusRequest;
use App\Http\Resources\Admin\ReferralResource;
use App\Http\Resources\Admin\ReferrerReferralGroupResource;
use App\Models\Referral;
use App\Services\Admin\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class ReferralController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    public function index(): Response
    {
        return Inertia::render('referrals/index', [
            'statuses' => ReferralStatus::options(),
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        return ReferrerReferralGroupResource::collection(
            $this->referrals->paginate($request),
        );
    }

    public function updateStatus(
        UpdateReferralStatusRequest $request,
        Referral $referral,
    ): JsonResponse {
        $status = ReferralStatus::from($request->string('status')->toString());
        $rewardAmount = $request->validated('reward_amount');
        $updated = $this->referrals->updateStatus(
            $referral,
            $status,
            $rewardAmount !== null ? (string) $rewardAmount : null,
        );

        return response()->json([
            'message' => __('Referral status updated.'),
            'referral' => (new ReferralResource($updated))->resolve(),
        ]);
    }
}
