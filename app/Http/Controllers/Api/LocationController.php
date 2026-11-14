<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Property\LocationOptionResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        $locations = Location::query()
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'area']);

        return $this->success(
            'Locations retrieved.',
            200,
            LocationOptionResource::collection($locations)->resolve(),
        );
    }
}
