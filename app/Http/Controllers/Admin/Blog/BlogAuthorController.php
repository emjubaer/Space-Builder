<?php

namespace App\Http\Controllers\Admin\Blog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Blog\Author\StoreBlogAuthorRequest;
use App\Http\Requests\Admin\Blog\Author\UpdateBlogAuthorRequest;
use App\Http\Resources\Admin\Blog\BlogAuthorResource;
use App\Models\BlogAuthor;
use App\Models\User;
use App\Services\Admin\BlogAuthorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BlogAuthorController extends Controller
{
    public function __construct(private BlogAuthorService $authors) {}

    public function index(): Response
    {
        return Inertia::render('blogs/authors/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $authors = BlogAuthor::query()
            ->with('user:id,name,email,avatar')
            ->withCount('blogs')
            ->when($search !== '', function ($query) use ($search): void {
                $query->whereHas('user', function ($userQuery) use ($search): void {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return BlogAuthorResource::collection($authors);
    }

    public function users(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();

        $users = User::query()
            ->select('id', 'name', 'email', 'avatar')
            ->whereDoesntHave('blogAuthor', fn ($query) => $query->withTrashed())
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit(30)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar
                    ? Storage::disk('public')->url($user->avatar)
                    : null,
            ]);

        return response()->json(['data' => $users]);
    }

    public function store(StoreBlogAuthorRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar');
        }

        $this->authors->create($data, $request->user());

        return response()->json([
            'message' => __('Author created successfully.'),
        ], 201);
    }

    public function update(UpdateBlogAuthorRequest $request, BlogAuthor $blogAuthor): JsonResponse
    {
        $this->authors->update($blogAuthor, $request->validated());

        return response()->json([
            'message' => __('Author updated successfully.'),
        ]);
    }

    public function destroy(BlogAuthor $blogAuthor): JsonResponse
    {
        try {
            $this->authors->delete($blogAuthor);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first(),
            ], 422);
        }

        return response()->json([
            'message' => __('Author deleted successfully.'),
        ]);
    }
}
