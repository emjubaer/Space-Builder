<?php

namespace App\Services\Admin;

use App\Models\NewsletterSubscriber;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class NewsletterSubscriberService
{
    /**
     * @return LengthAwarePaginator<int, NewsletterSubscriber>
     */
    public function paginate(Request $request): LengthAwarePaginator
    {
        $search = $request->string('search')->toString();
        $isActive = $request->input('is_active');

        return NewsletterSubscriber::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('email', 'like', "%{$search}%");
            })
            ->when(
                $isActive !== null && $isActive !== '',
                fn ($query) => $query->where(
                    'is_active',
                    filter_var($isActive, FILTER_VALIDATE_BOOLEAN),
                ),
            )
            ->latest('subscribed_at')
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));
    }

    public function updateActive(
        NewsletterSubscriber $subscriber,
        bool $isActive,
    ): NewsletterSubscriber {
        $subscriber->update([
            'is_active' => $isActive,
            'subscribed_at' => $isActive ? now() : $subscriber->subscribed_at,
        ]);

        return $subscriber->refresh();
    }

    public function delete(NewsletterSubscriber $subscriber): void
    {
        $subscriber->delete();
    }
}
