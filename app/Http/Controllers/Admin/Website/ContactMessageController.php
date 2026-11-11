<?php

namespace App\Http\Controllers\Admin\Website;

use App\Enums\ContactMessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Website\UpdateContactMessageStatusRequest;
use App\Http\Resources\Admin\Website\ContactMessageResource;
use App\Models\ContactMessage;
use App\Services\Admin\ContactMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessageController extends Controller
{
    public function __construct(private ContactMessageService $contactMessages) {}

    public function index(): Response
    {
        return Inertia::render('website/contacts/index', [
            'statuses' => collect(ContactMessageStatus::cases())
                ->map(fn (ContactMessageStatus $status) => [
                    'value' => $status->value,
                    'label' => str($status->value)->replace('_', ' ')->title()->toString(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        return ContactMessageResource::collection(
            $this->contactMessages->paginate($request),
        );
    }

    public function show(ContactMessage $contactMessage): JsonResponse
    {
        $message = $this->contactMessages->markInProgressIfNew($contactMessage);

        return response()->json([
            'contact' => (new ContactMessageResource($message))->resolve(),
        ]);
    }

    public function updateStatus(
        UpdateContactMessageStatusRequest $request,
        ContactMessage $contactMessage,
    ): JsonResponse {
        $status = ContactMessageStatus::from($request->string('status')->toString());
        $message = $this->contactMessages->updateStatus($contactMessage, $status);

        return response()->json([
            'message' => __('Contact message status updated.'),
            'contact' => (new ContactMessageResource($message))->resolve(),
        ]);
    }

    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $this->contactMessages->delete($contactMessage);

        return response()->json([
            'message' => __('Contact message deleted successfully.'),
        ]);
    }
}
