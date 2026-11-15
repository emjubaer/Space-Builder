<?php

namespace App\Services;

use App\Models\NewsletterSubscriber;

class NewsletterService
{
    /**
     * @param  array{email: string}  $data
     */
    public function subscribe(array $data): NewsletterSubscriber
    {
        $email = strtolower(trim($data['email']));

        $subscriber = NewsletterSubscriber::query()
            ->where('email', $email)
            ->first();

        if ($subscriber === null) {
            return NewsletterSubscriber::query()->create([
                'email' => $email,
                'is_active' => true,
                'subscribed_at' => now(),
            ]);
        }

        if (! $subscriber->is_active) {
            $subscriber->update([
                'is_active' => true,
                'subscribed_at' => now(),
            ]);
        }

        return $subscriber->refresh();
    }
}
