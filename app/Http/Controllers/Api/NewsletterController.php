<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SubscribeNewsletterRequest;
use App\Http\Resources\Api\NewsletterSubscriberResource;
use App\Services\NewsletterService;
use Illuminate\Http\JsonResponse;

class NewsletterController extends Controller
{
    public function __construct(private NewsletterService $newsletter) {}

    public function subscribe(SubscribeNewsletterRequest $request): JsonResponse
    {
        $subscriber = $this->newsletter->subscribe($request->validated());

        return $this->success(
            __('Subscribed to the newsletter successfully.'),
            201,
            (new NewsletterSubscriberResource($subscriber))->resolve(),
        );
    }
}
