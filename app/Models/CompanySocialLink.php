<?php

namespace App\Models;

use App\Enums\SocialPlatform;
use Database\Factories\CompanySocialLinkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'company_profile_id',
    'platform',
    'url',
    'is_active',
    'sort_order',
])]
class CompanySocialLink extends Model
{
    /** @use HasFactory<CompanySocialLinkFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'platform' => SocialPlatform::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<CompanyProfile, $this>
     */
    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }
}
