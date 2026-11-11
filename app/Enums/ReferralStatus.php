<?php

namespace App\Enums;

enum ReferralStatus: string
{
    case Pending = 'pending';
    case Contacted = 'contacted';
    case Converted = 'converted';
    case Rejected = 'rejected';
}
