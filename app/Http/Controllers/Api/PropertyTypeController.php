<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Property\PropertyTypeResource;
use App\Models\PropertyType;
use Illuminate\Http\JsonResponse;

class PropertyTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = PropertyType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return $this->success(
            'Property types retrieved.',
            200,
            PropertyTypeResource::collection($types)->resolve(),
        );
    }
}
