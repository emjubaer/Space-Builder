<?php

namespace App\Enums;

enum ReferralRewardStatus: string
{
    case Pending = 'pending';
    case Earned = 'earned';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}
