<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CompanyProfileResource;
use App\Models\CompanyProfile;
use Illuminate\Http\JsonResponse;

class CompanyProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $profile = CompanyProfile::current()->load([
            'socialLinks' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order'),
            'offices' => fn ($query) => $query->orderByDesc('is_head_office')->orderBy('name'),
        ]);

        return response()->json([
            'data' => (new CompanyProfileResource($profile))->resolve(),
        ]);
    }
}
