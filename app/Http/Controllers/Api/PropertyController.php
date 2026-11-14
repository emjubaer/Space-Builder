<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\FeaturedPropertiesRequest;
use App\Http\Requests\Api\IndexPropertiesRequest;
use App\Http\Resources\Api\Property\ConstructionTaskResource;
use App\Http\Resources\Api\Property\PropertyDetailResource;
use App\Http\Resources\Api\Property\PropertySummaryResource;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;

class PropertyController extends Controller
{
    public function __construct(private PropertyService $properties) {}

    public function featured(FeaturedPropertiesRequest $request): JsonResponse
    {
        $properties = $this->properties->featured($request->limit());

        return $this->success(
            'Featured properties retrieved.',
            200,
            PropertySummaryResource::collection($properties)->resolve(),
        );
    }

    public function index(IndexPropertiesRequest $request): JsonResponse
    {
        $paginator = $this->properties->paginate(
            $request->limit(),
            $request->propertyTypeId(),
            $request->locationId(),
            $request->status(),
        );

        return $this->success(
            'Properties retrieved.',
            200,
            PropertySummaryResource::collection($paginator)->resolve(),
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

    public function show(string $slug): JsonResponse
    {
        $property = $this->properties->findPublishedBySlug($slug);

        return $this->success(
            'Property retrieved.',
            200,
            (new PropertyDetailResource($property))->resolve(),
        );
    }

    public function construction(string $slug): JsonResponse
    {
        $progress = $this->properties->constructionProgress($slug);
        $property = $progress['property'];

        return $this->success(
            'Construction progress retrieved.',
            200,
            [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                    'slug' => $property->slug,
                ],
                'overall_progress' => $progress['overall_progress'],
                'tasks' => ConstructionTaskResource::collection($progress['tasks'])->resolve(),
            ],
        );
    }
}
