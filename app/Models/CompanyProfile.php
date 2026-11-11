<?php

namespace App\Models;

use Database\Factories\CompanyProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'company_name',
    'tagline',
    'description',
    'logo',
    'favicon',
    'email',
    'phone',
    'address',
    'website_url',
    'copyright_text',
    'latitude',
    'longitude',
])]
class CompanyProfile extends Model
{
    /** @use HasFactory<CompanyProfileFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /**
     * @return HasMany<CompanySocialLink, $this>
     */
    public function socialLinks(): HasMany
    {
        return $this->hasMany(CompanySocialLink::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<CompanyOffice, $this>
     */
    public function offices(): HasMany
    {
        return $this->hasMany(CompanyOffice::class)
            ->orderByDesc('is_head_office')
            ->orderBy('name');
    }

    public static function current(): self
    {
        $existing = static::query()->first();

        if ($existing !== null) {
            return $existing;
        }

        return static::query()->create([
            'company_name' => config('app.name', 'Space Builder'),
            'tagline' => null,
            'description' => null,
            'logo' => null,
            'favicon' => null,
            'email' => null,
            'phone' => null,
            'address' => null,
            'website_url' => null,
            'copyright_text' => null,
            'latitude' => null,
            'longitude' => null,
        ]);
    }
}
