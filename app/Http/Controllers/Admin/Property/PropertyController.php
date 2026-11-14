<?php

namespace App\Http\Controllers\Admin\Property;

use App\Enums\ConstructionTaskStatus;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Property\StorePropertyRequest;
use App\Http\Requests\Admin\Property\UpdatePropertyRequest;
use App\Http\Resources\Admin\Property\ConstructionTaskResource;
use App\Http\Resources\Admin\Property\PropertyResource;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyFeature;
use App\Models\PropertyType;
use App\Services\Admin\PropertyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function __construct(private PropertyService $properties) {}

    public function index(): Response
    {
        return Inertia::render('properties/index', [
            ...$this->filterProps(),
            'constructionTaskStatuses' => ConstructionTaskStatus::options(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('properties/create', [
            ...$this->filterProps(),
            'property' => null,
            'constructionTasks' => [],
            'constructionTaskStatuses' => ConstructionTaskStatus::options(),
        ]);
    }

    public function edit(Property $property): Response
    {
        $property->load([
            'location',
            'propertyType',
            'features',
            'images',
            'constructionTasks',
        ]);

        return Inertia::render('properties/create', [
            ...$this->filterProps(),
            'property' => (new PropertyResource($property))->resolve(),
            'constructionTasks' => ConstructionTaskResource::collection(
                $property->constructionTasks,
            )->resolve(),
            'constructionTaskStatuses' => ConstructionTaskStatus::options(),
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $typeId = $request->integer('property_type_id') ?: null;
        $featured = $request->query('is_featured');

        $properties = Property::query()
            ->with([
                'location:id,name,city',
                'propertyType:id,name,slug',
                'images',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($typeId !== null, fn ($query) => $query->where('property_type_id', $typeId))
            ->when(
                $featured !== null && $featured !== '',
                fn ($query) => $query->where('is_featured', filter_var($featured, FILTER_VALIDATE_BOOLEAN)),
            )
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return PropertyResource::collection($properties);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['cover_image'] = $request->file('cover_image');
        $data['gallery_images'] = $request->file('gallery_images') ?? [];
        $data['floor_plan_images'] = $request->file('floor_plan_images') ?? [];
        $data['tour_images'] = $request->file('tour_images') ?? [];

        $property = $this->properties->create($data);

        return response()->json([
            'message' => __('Property created successfully.'),
            'property' => (new PropertyResource($property))->resolve(),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $data = $request->validated();
        $data['cover_image'] = $request->file('cover_image');
        $data['gallery_images'] = $request->file('gallery_images') ?? [];
        $data['floor_plan_images'] = $request->file('floor_plan_images') ?? [];
        $data['tour_images'] = $request->file('tour_images') ?? [];

        $property = $this->properties->update($property, $data);

        return response()->json([
            'message' => __('Property updated successfully.'),
            'property' => (new PropertyResource($property))->resolve(),
        ]);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->properties->delete($property);

        return response()->json([
            'message' => __('Property deleted successfully.'),
        ]);
    }

    /**
     * @return array{
     *     locations: mixed,
     *     types: mixed,
     *     features: mixed,
     *     statuses: list<array{value: string, label: string}>
     * }
     */
    private function filterProps(): array
    {
        return [
            'locations' => Location::query()->orderBy('name')->get(['id', 'name', 'city']),
            'types' => PropertyType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'features' => PropertyFeature::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'icon']),
            'statuses' => collect(PropertyStatus::cases())
                ->map(fn (PropertyStatus $status) => [
                    'value' => $status->value,
                    'label' => str_replace('_', ' ', ucfirst($status->value)),
                ])
                ->values()
                ->all(),
        ];
    }
}
