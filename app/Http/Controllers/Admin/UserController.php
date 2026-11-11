<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\User\ChangeUserPasswordRequest;
use App\Http\Requests\Admin\User\StoreUserRequest;
use App\Http\Requests\Admin\User\UpdateUserRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Services\Admin\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(private UserService $users) {}

    public function index(): Response
    {
        $roles = Role::query()
            ->whereIn('name', array_column(UserRole::cases(), 'value'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('users/index', [
            'roles' => $roles,
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $users = User::query()
            ->with('roles:id,name')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->users->create($request->validated());

        return response()->json([
            'message' => __('User created successfully.'),
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->users->update($user, $request->validated());

        return response()->json([
            'message' => __('User updated successfully.'),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => __('You cannot delete your own account.'),
            ], 422);
        }

        $this->users->delete($user);

        return response()->json([
            'message' => __('User deleted successfully.'),
        ]);
    }

    public function changePassword(ChangeUserPasswordRequest $request, User $user): JsonResponse
    {
        $this->users->changePassword($user, $request->string('password')->toString());

        return response()->json([
            'message' => __('Password changed successfully.'),
        ]);
    }
}
