<?php

namespace App\Enums;

enum VideoProvider: string
{
    case Youtube = 'youtube';
    case Vimeo = 'vimeo';
    case SelfHosted = 'self_hosted';

    public function label(): string
    {
        return match ($this) {
            self::Youtube => 'YouTube',
            self::Vimeo => 'Vimeo',
            self::SelfHosted => 'Self hosted',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $provider) => [
                'value' => $provider->value,
                'label' => $provider->label(),
            ])
            ->values()
            ->all();
    }
}
