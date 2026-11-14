<?php

namespace App\Http\Controllers\Admin\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Property\Feature\StorePropertyFeatureRequest;
use App\Http\Requests\Admin\Property\Feature\UpdatePropertyFeatureRequest;
use App\Http\Resources\Admin\Property\PropertyFeatureResource;
use App\Models\PropertyFeature;
use App\Services\Admin\PropertyFeatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PropertyFeatureController extends Controller
{
    public function __construct(private PropertyFeatureService $features) {}

    public function index(): Response
    {
        return Inertia::render('properties/features/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $features = PropertyFeature::query()
            ->withCount('properties')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return PropertyFeatureResource::collection($features);
    }

    public function store(StorePropertyFeatureRequest $request): JsonResponse
    {
        $this->features->create($request->validated());

        return response()->json([
            'message' => __('Feature created successfully.'),
        ], 201);
    }

    public function update(UpdatePropertyFeatureRequest $request, PropertyFeature $propertyFeature): JsonResponse
    {
        $this->features->update($propertyFeature, $request->validated());

        return response()->json([
            'message' => __('Feature updated successfully.'),
        ]);
    }

    public function destroy(PropertyFeature $propertyFeature): JsonResponse
    {
        try {
            $this->features->delete($propertyFeature);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first(),
            ], 422);
        }

        return response()->json([
            'message' => __('Feature deleted successfully.'),
        ]);
    }
}
