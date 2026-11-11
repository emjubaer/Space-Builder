<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('permissions/index');
    }

    public function list(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();

        $permissions = Permission::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->get(['id', 'name', 'created_at', 'updated_at']);

        return response()->json([
            'data' => $permissions,
        ]);
    }
}
