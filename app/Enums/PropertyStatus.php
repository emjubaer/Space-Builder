<?php

namespace App\Enums;

enum PropertyStatus: string
{
    case Draft = 'draft';
    case Upcoming = 'upcoming';
    case Ongoing = 'ongoing';
    case Completed = 'completed';
    case SoldOut = 'sold_out';
}
