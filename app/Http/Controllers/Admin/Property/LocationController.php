<?php

namespace App\Http\Controllers\Admin\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Property\Location\StoreLocationRequest;
use App\Http\Requests\Admin\Property\Location\UpdateLocationRequest;
use App\Http\Resources\Admin\Property\LocationResource;
use App\Models\Location;
use App\Services\Admin\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function __construct(private LocationService $locations) {}

    public function index(): Response
    {
        return Inertia::render('properties/locations/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $locations = Location::query()
            ->withCount('properties')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('area', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return LocationResource::collection($locations);
    }

    public function store(StoreLocationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['image'] = $request->file('image');

        $this->locations->create($data);

        return response()->json([
            'message' => __('Location created successfully.'),
        ], 201);
    }

    public function update(UpdateLocationRequest $request, Location $location): JsonResponse
    {
        $data = $request->validated();
        $data['image'] = $request->file('image');

        $this->locations->update($location, $data);

        return response()->json([
            'message' => __('Location updated successfully.'),
        ]);
    }

    public function destroy(Location $location): JsonResponse
    {
        try {
            $this->locations->delete($location);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first(),
            ], 422);
        }

        return response()->json([
            'message' => __('Location deleted successfully.'),
        ]);
    }
}
