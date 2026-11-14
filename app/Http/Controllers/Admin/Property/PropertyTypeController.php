<?php

namespace App\Http\Controllers\Admin\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Property\Type\StorePropertyTypeRequest;
use App\Http\Requests\Admin\Property\Type\UpdatePropertyTypeRequest;
use App\Http\Resources\Admin\Property\PropertyTypeResource;
use App\Models\PropertyType;
use App\Services\Admin\PropertyTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PropertyTypeController extends Controller
{
    public function __construct(private PropertyTypeService $types) {}

    public function index(): Response
    {
        return Inertia::render('properties/types/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $types = PropertyType::query()
            ->withCount('properties')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return PropertyTypeResource::collection($types);
    }

    public function store(StorePropertyTypeRequest $request): JsonResponse
    {
        $this->types->create($request->validated());

        return response()->json([
            'message' => __('Property type created successfully.'),
        ], 201);
    }

    public function update(UpdatePropertyTypeRequest $request, PropertyType $propertyType): JsonResponse
    {
        $this->types->update($propertyType, $request->validated());

        return response()->json([
            'message' => __('Property type updated successfully.'),
        ]);
    }

    public function destroy(PropertyType $propertyType): JsonResponse
    {
        try {
            $this->types->delete($propertyType);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first(),
            ], 422);
        }

        return response()->json([
            'message' => __('Property type deleted successfully.'),
        ]);
    }
}
