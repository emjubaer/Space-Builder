<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReferralSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StorePublicReferralRequest;
use App\Http\Requests\Api\StoreReferralRequest;
use App\Http\Resources\Api\ReferralResource;
use App\Services\ReferralService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    public function index(Request $request): JsonResponse
    {
        $list = $this->referrals->listFor($request->user());

        return $this->success(__('Referrals retrieved successfully.'), 200, [
            'user' => $list['user'],
            'referrals' => ReferralResource::collection($list['referrals'])->resolve(),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $summary = $this->referrals->summaryFor($request->user());

        return $this->success(__('Referral summary retrieved successfully.'), 200, [
            'user' => $summary['user'],
            'stats' => $summary['stats'],
        ]);
    }

    public function store(StoreReferralRequest $request): JsonResponse
    {
        $referral = $this->referrals->create(
            $request->user(),
            $request->validated(),
            ReferralSource::Manual,
        );

        return $this->success(
            __('Referral added successfully.'),
            201,
            (new ReferralResource($referral))->resolve(),
        );
    }

    public function storeByCode(StorePublicReferralRequest $request, string $referralCode): JsonResponse
    {
        try {
            $referral = $this->referrals->createFromCode(
                $referralCode,
                $request->validated(),
            );
        } catch (ModelNotFoundException) {
            return $this->error(
                __('Invalid referral link. No referrer was found for this code.'),
                404,
            );
        }

        return $this->success(
            __('Referral added successfully.'),
            201,
            (new ReferralResource($referral))->resolve(),
        );
    }
}
