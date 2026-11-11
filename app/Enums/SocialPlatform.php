<?php

namespace App\Enums;

enum SocialPlatform: string
{
    case Facebook = 'facebook';
    case Instagram = 'instagram';
    case Linkedin = 'linkedin';
    case Twitter = 'twitter';
    case Youtube = 'youtube';
    case Website = 'website';

    public function label(): string
    {
        return match ($this) {
            self::Facebook => 'Facebook',
            self::Instagram => 'Instagram',
            self::Linkedin => 'LinkedIn',
            self::Twitter => 'Twitter / X',
            self::Youtube => 'YouTube',
            self::Website => 'Website',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $platform) => [
                'value' => $platform->value,
                'label' => $platform->label(),
            ])
            ->values()
            ->all();
    }
}
