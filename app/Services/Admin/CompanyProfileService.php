<?php

namespace App\Services\Admin;

use App\Models\CompanyOffice;
use App\Models\CompanyProfile;
use App\Models\CompanySocialLink;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CompanyProfileService
{
    public function current(): CompanyProfile
    {
        return CompanyProfile::current()->load([
            'socialLinks',
            'offices',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateProfile(CompanyProfile $profile, array $data): CompanyProfile
    {
        $logo = $profile->logo;
        $favicon = $profile->favicon;

        if (($data['logo'] ?? null) instanceof UploadedFile) {
            $this->deleteStoredFile($profile->logo);
            $logo = $data['logo']->store('company', 'public');
        } elseif (array_key_exists('remove_logo', $data) && $this->toBoolean($data['remove_logo'])) {
            $this->deleteStoredFile($profile->logo);
            $logo = null;
        }

        if (($data['favicon'] ?? null) instanceof UploadedFile) {
            $this->deleteStoredFile($profile->favicon);
            $favicon = $data['favicon']->store('company', 'public');
        } elseif (array_key_exists('remove_favicon', $data) && $this->toBoolean($data['remove_favicon'])) {
            $this->deleteStoredFile($profile->favicon);
            $favicon = null;
        }

        $profile->update([
            'company_name' => $data['company_name'],
            'tagline' => $data['tagline'] ?? null,
            'description' => $data['description'] ?? null,
            'logo' => $logo,
            'favicon' => $favicon,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'website_url' => $data['website_url'] ?? null,
            'copyright_text' => $data['copyright_text'] ?? null,
            'latitude' => $this->nullableCoordinate($data['latitude'] ?? null),
            'longitude' => $this->nullableCoordinate($data['longitude'] ?? null),
        ]);

        return $profile->refresh()->load(['socialLinks', 'offices']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createSocialLink(CompanyProfile $profile, array $data): CompanySocialLink
    {
        return $profile->socialLinks()->create([
            'platform' => $data['platform'],
            'url' => $data['url'],
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateSocialLink(CompanySocialLink $socialLink, array $data): CompanySocialLink
    {
        $socialLink->update([
            'platform' => $data['platform'],
            'url' => $data['url'],
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : $socialLink->is_active,
            'sort_order' => $data['sort_order'] ?? $socialLink->sort_order,
        ]);

        return $socialLink->refresh();
    }

    public function deleteSocialLink(CompanySocialLink $socialLink): void
    {
        $socialLink->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createOffice(CompanyProfile $profile, array $data): CompanyOffice
    {
        return DB::transaction(function () use ($profile, $data) {
            $isHeadOffice = array_key_exists('is_head_office', $data)
                ? $this->toBoolean($data['is_head_office'])
                : false;

            if ($isHeadOffice) {
                $this->clearHeadOffice($profile);
            }

            return $profile->offices()->create([
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'is_head_office' => $isHeadOffice,
                'latitude' => $this->nullableCoordinate($data['latitude'] ?? null),
                'longitude' => $this->nullableCoordinate($data['longitude'] ?? null),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateOffice(CompanyOffice $office, array $data): CompanyOffice
    {
        return DB::transaction(function () use ($office, $data) {
            $isHeadOffice = array_key_exists('is_head_office', $data)
                ? $this->toBoolean($data['is_head_office'])
                : $office->is_head_office;

            if ($isHeadOffice) {
                $this->clearHeadOffice($office->companyProfile, $office->id);
            }

            $office->update([
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'is_head_office' => $isHeadOffice,
                'latitude' => $this->nullableCoordinate($data['latitude'] ?? null),
                'longitude' => $this->nullableCoordinate($data['longitude'] ?? null),
            ]);

            return $office->refresh();
        });
    }

    public function deleteOffice(CompanyOffice $office): void
    {
        $office->delete();
    }

    private function clearHeadOffice(CompanyProfile $profile, ?int $exceptId = null): void
    {
        $profile->offices()
            ->when($exceptId !== null, fn ($query) => $query->whereKeyNot($exceptId))
            ->update(['is_head_office' => false]);
    }

    private function deleteStoredFile(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function nullableCoordinate(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
