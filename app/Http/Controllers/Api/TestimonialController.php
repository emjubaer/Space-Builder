<?php

namespace App\Http\Controllers\Api;

use App\Enums\TestimonialType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\TestimonialResource;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ValueError;

class TestimonialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $typeValue = $request->string('type')->toString() ?: TestimonialType::Text->value;

        try {
            $type = TestimonialType::from($typeValue);
        } catch (ValueError) {
            $type = TestimonialType::Text;
        }

        $query = Testimonial::query()
            ->active()
            ->where('type', $type)
            ->orderBy('sort_order')
            ->latest();

        if ($request->boolean('paginate')) {
            $paginator = $query->paginate($request->integer('per_page', 15));

            return $this->success(
                'Testimonials retrieved.',
                200,
                TestimonialResource::collection($paginator)->resolve(),
                [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ],
            );
        }

        return $this->success(
            'Testimonials retrieved.',
            200,
            TestimonialResource::collection($query->get())->resolve(),
        );
    }
}
