<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreContactMessageRequest;
use App\Http\Resources\Api\ContactMessageResource;
use App\Services\ContactMessageService;
use Illuminate\Http\JsonResponse;

class ContactMessageController extends Controller
{
    public function __construct(private ContactMessageService $contactMessages) {}

    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $message = $this->contactMessages->create($request->validated());

        return $this->success(
            __('Your message has been sent successfully.'),
            201,
            (new ContactMessageResource($message))->resolve(),
        );
    }
}
