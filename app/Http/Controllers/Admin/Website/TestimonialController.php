<?php

namespace App\Http\Controllers\Admin\Website;

use App\Enums\TestimonialType;
use App\Enums\VideoProvider;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Website\Testimonial\StoreTestimonialRequest;
use App\Http\Requests\Admin\Website\Testimonial\UpdateTestimonialRequest;
use App\Http\Resources\Admin\Website\TestimonialResource;
use App\Models\Testimonial;
use App\Services\Admin\TestimonialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class TestimonialController extends Controller
{
    public function __construct(private TestimonialService $testimonials) {}

    public function index(): Response
    {
        return Inertia::render('website/testimonials/index', [
            'types' => TestimonialType::options(),
            'videoProviders' => VideoProvider::options(),
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();
        $type = $request->string('type')->toString();
        $isActive = $request->input('is_active');

        $testimonials = Testimonial::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('reviewer_name', 'like', "%{$search}%")
                        ->orWhere('reviewer_company', 'like', "%{$search}%");
                });
            })
            ->when($type !== '', fn ($query) => $query->where('type', $type))
            ->when(
                $isActive !== null && $isActive !== '',
                fn ($query) => $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN)),
            )
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return TestimonialResource::collection($testimonials);
    }

    public function store(StoreTestimonialRequest $request): JsonResponse
    {
        $this->testimonials->create($request->validated(), $request->user());

        return response()->json([
            'message' => __('Testimonial created successfully.'),
        ], 201);
    }

    public function update(UpdateTestimonialRequest $request, Testimonial $testimonial): JsonResponse
    {
        $this->testimonials->update($testimonial, $request->validated());

        return response()->json([
            'message' => __('Testimonial updated successfully.'),
            'testimonial' => (new TestimonialResource($testimonial->fresh()))->resolve(),
        ]);
    }

    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $this->testimonials->delete($testimonial);

        return response()->json([
            'message' => __('Testimonial deleted successfully.'),
        ]);
    }
}
