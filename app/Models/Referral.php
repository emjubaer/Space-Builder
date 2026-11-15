<?php

namespace App\Models;

use App\Enums\ReferralSource;
use App\Enums\ReferralStatus;
use Database\Factories\ReferralFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'referrer_id',
    'referred_user_id',
    'referred_name',
    'referred_phone',
    'note',
    'permission_confirmed',
    'status',
    'source',
    'converted_at',
])]
class Referral extends Model
{
    /** @use HasFactory<ReferralFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'permission_confirmed' => 'boolean',
            'status' => ReferralStatus::class,
            'source' => ReferralSource::class,
            'converted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    /**
     * @return HasMany<ReferralReward, $this>
     */
    public function rewards(): HasMany
    {
        return $this->hasMany(ReferralReward::class);
    }
}
