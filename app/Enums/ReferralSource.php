<?php

namespace App\Enums;

enum ReferralSource: string
{
    case Manual = 'manual';
    case Link = 'link';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Link => 'Link',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $source) => [
                'value' => $source->value,
                'label' => $source->label(),
            ])
            ->values()
            ->all();
    }
}
