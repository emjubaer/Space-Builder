<?php

namespace App\Http\Controllers\Admin\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Website\UpdateNewsletterSubscriberStatusRequest;
use App\Http\Resources\Admin\Website\NewsletterSubscriberResource;
use App\Models\NewsletterSubscriber;
use App\Services\Admin\NewsletterSubscriberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterSubscriberController extends Controller
{
    public function __construct(private NewsletterSubscriberService $subscribers) {}

    public function index(): Response
    {
        return Inertia::render('website/newsletter/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        return NewsletterSubscriberResource::collection(
            $this->subscribers->paginate($request),
        );
    }

    public function updateStatus(
        UpdateNewsletterSubscriberStatusRequest $request,
        NewsletterSubscriber $newsletterSubscriber,
    ): JsonResponse {
        $subscriber = $this->subscribers->updateActive(
            $newsletterSubscriber,
            $request->boolean('is_active'),
        );

        return response()->json([
            'message' => __('Subscriber status updated.'),
            'subscriber' => (new NewsletterSubscriberResource($subscriber))->resolve(),
        ]);
    }

    public function destroy(NewsletterSubscriber $newsletterSubscriber): JsonResponse
    {
        $this->subscribers->delete($newsletterSubscriber);

        return response()->json([
            'message' => __('Subscriber deleted successfully.'),
        ]);
    }
}
