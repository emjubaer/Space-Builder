<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Role\StoreRoleRequest;
use App\Http\Requests\Admin\Role\UpdateRoleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): Response
    {
        $permissions = Permission::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('roles/index', [
            'permissions' => $permissions,
        ]);
    }

    public function list(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();

        $roles = Role::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->with('permissions:id,name')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json($roles);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->string('name')->toString(),
            'guard_name' => 'web',
        ]);

        $permissionNames = Permission::query()
            ->whereIn('id', $request->input('permissions', []))
            ->pluck('name')
            ->all();

        $role->syncPermissions($permissionNames);

        return response()->json([
            'message' => __('Role created successfully.'),
        ], 201);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $role->update([
            'name' => $request->string('name')->toString(),
        ]);

        $permissionNames = Permission::query()
            ->whereIn('id', $request->input('permissions', []))
            ->pluck('name')
            ->all();

        $role->syncPermissions($permissionNames);

        return response()->json([
            'message' => __('Role updated successfully.'),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        $protected = array_map(
            fn (UserRole $case) => $case->value,
            UserRole::cases(),
        );

        if (in_array($role->name, $protected, true)) {
            return response()->json([
                'message' => __('This role cannot be deleted.'),
            ], 422);
        }

        DB::transaction(function () use ($role): void {
            $role->syncPermissions([]);
            $role->delete();
        });

        return response()->json([
            'message' => __('Role deleted successfully.'),
        ]);
    }
}
