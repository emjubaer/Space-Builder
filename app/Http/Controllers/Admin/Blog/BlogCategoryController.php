<?php

namespace App\Http\Controllers\Admin\Blog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Blog\Category\StoreBlogCategoryRequest;
use App\Http\Requests\Admin\Blog\Category\UpdateBlogCategoryRequest;
use App\Http\Resources\Admin\Blog\BlogCategoryResource;
use App\Models\BlogCategory;
use App\Services\Admin\BlogCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BlogCategoryController extends Controller
{
    public function __construct(private BlogCategoryService $categories) {}

    public function index(): Response
    {
        return Inertia::render('blogs/categories/index');
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $categories = BlogCategory::query()
            ->withCount('blogs')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return BlogCategoryResource::collection($categories);
    }

    public function store(StoreBlogCategoryRequest $request): JsonResponse
    {
        $this->categories->create($request->validated());

        return response()->json([
            'message' => __('Category created successfully.'),
        ], 201);
    }

    public function update(UpdateBlogCategoryRequest $request, BlogCategory $blogCategory): JsonResponse
    {
        $this->categories->update($blogCategory, $request->validated());

        return response()->json([
            'message' => __('Category updated successfully.'),
        ]);
    }

    public function destroy(BlogCategory $blogCategory): JsonResponse
    {
        try {
            $this->categories->delete($blogCategory);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first(),
            ], 422);
        }

        return response()->json([
            'message' => __('Category deleted successfully.'),
        ]);
    }
}
