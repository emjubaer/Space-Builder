<?php

namespace App\Enums;

enum PropertyImageType: string
{
    case Cover = 'cover';
    case Gallery = 'gallery';
    case FloorPlan = 'floor_plan';
    case Tour = 'tour';

    public function label(): string
    {
        return match ($this) {
            self::Cover => 'Cover',
            self::Gallery => 'Gallery',
            self::FloorPlan => 'Floor Plan',
            self::Tour => 'Tour',
        };
    }

    public function allowsMultiple(): bool
    {
        return $this !== self::Cover;
    }
}
