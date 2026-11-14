<?php

namespace App\Http\Controllers\Api;

use App\Enums\TestimonialType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\TestimonialResource;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use ValueError;

class TestimonialController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
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
            return TestimonialResource::collection(
                $query->paginate($request->integer('per_page', 15)),
            );
        }

        return TestimonialResource::collection($query->get());
    }
}
