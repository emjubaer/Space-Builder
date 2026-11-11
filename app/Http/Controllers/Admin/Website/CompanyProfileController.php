<?php

namespace App\Http\Controllers\Admin\Website;

use App\Enums\SocialPlatform;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Website\StoreCompanyOfficeRequest;
use App\Http\Requests\Admin\Website\StoreCompanySocialLinkRequest;
use App\Http\Requests\Admin\Website\UpdateCompanyOfficeRequest;
use App\Http\Requests\Admin\Website\UpdateCompanyProfileRequest;
use App\Http\Requests\Admin\Website\UpdateCompanySocialLinkRequest;
use App\Http\Resources\Admin\Website\CompanyOfficeResource;
use App\Http\Resources\Admin\Website\CompanyProfileResource;
use App\Http\Resources\Admin\Website\CompanySocialLinkResource;
use App\Models\CompanyOffice;
use App\Models\CompanySocialLink;
use App\Services\Admin\CompanyProfileService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompanyProfileController extends Controller
{
    public function __construct(private CompanyProfileService $companyProfiles) {}

    public function index(): Response
    {
        $profile = $this->companyProfiles->current();

        return Inertia::render('website/general/index', [
            'profile' => (new CompanyProfileResource($profile))->resolve(),
            'platforms' => SocialPlatform::options(),
        ]);
    }

    public function update(UpdateCompanyProfileRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['logo'] = $request->file('logo');
        $data['favicon'] = $request->file('favicon');

        $profile = $this->companyProfiles->updateProfile(
            $this->companyProfiles->current(),
            $data,
        );

        return response()->json([
            'message' => __('Website general settings updated successfully.'),
            'profile' => (new CompanyProfileResource($profile))->resolve(),
        ]);
    }

    public function storeSocialLink(StoreCompanySocialLinkRequest $request): JsonResponse
    {
        $link = $this->companyProfiles->createSocialLink(
            $this->companyProfiles->current(),
            $request->validated(),
        );

        return response()->json([
            'message' => __('Social link created successfully.'),
            'social_link' => (new CompanySocialLinkResource($link))->resolve(),
        ], 201);
    }

    public function updateSocialLink(
        UpdateCompanySocialLinkRequest $request,
        CompanySocialLink $socialLink,
    ): JsonResponse {
        $link = $this->companyProfiles->updateSocialLink($socialLink, $request->validated());

        return response()->json([
            'message' => __('Social link updated successfully.'),
            'social_link' => (new CompanySocialLinkResource($link))->resolve(),
        ]);
    }

    public function destroySocialLink(CompanySocialLink $socialLink): JsonResponse
    {
        $this->companyProfiles->deleteSocialLink($socialLink);

        return response()->json([
            'message' => __('Social link deleted successfully.'),
        ]);
    }

    public function storeOffice(StoreCompanyOfficeRequest $request): JsonResponse
    {
        $office = $this->companyProfiles->createOffice(
            $this->companyProfiles->current(),
            $request->validated(),
        );

        return response()->json([
            'message' => __('Office created successfully.'),
            'office' => (new CompanyOfficeResource($office))->resolve(),
        ], 201);
    }

    public function updateOffice(
        UpdateCompanyOfficeRequest $request,
        CompanyOffice $office,
    ): JsonResponse {
        $office = $this->companyProfiles->updateOffice($office, $request->validated());

        return response()->json([
            'message' => __('Office updated successfully.'),
            'office' => (new CompanyOfficeResource($office))->resolve(),
        ]);
    }

    public function destroyOffice(CompanyOffice $office): JsonResponse
    {
        $this->companyProfiles->deleteOffice($office);

        return response()->json([
            'message' => __('Office deleted successfully.'),
        ]);
    }
}
