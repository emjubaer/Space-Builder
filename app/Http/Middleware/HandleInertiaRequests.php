<?php

namespace App\Http\Middleware;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $branding = $this->branding();

        return [
            ...parent::share($request),
            'name' => $branding['name'],
            'branding' => $branding,
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile' => $user->mobile,
                    'avatar' => $user->avatar
                        ? Storage::disk('public')->url($user->avatar)
                        : null,
                    'referral_code' => $user->referral_code,
                    'email_verified_at' => $user->email_verified_at,
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{name: string, logo_url: string|null, favicon_url: string|null}
     */
    private function branding(): array
    {
        $fallbackName = (string) config('app.name', 'SpaceBuilder');
        $profile = CompanyProfile::query()->first();

        if ($profile === null) {
            return [
                'name' => $fallbackName,
                'logo_url' => null,
                'favicon_url' => null,
            ];
        }

        return [
            'name' => filled($profile->company_name)
                ? $profile->company_name
                : $fallbackName,
            'logo_url' => $profile->logo
                ? Storage::disk('public')->url($profile->logo)
                : null,
            'favicon_url' => $profile->favicon
                ? Storage::disk('public')->url($profile->favicon)
                : null,
        ];
    }
}
