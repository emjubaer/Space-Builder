<?php

namespace App\Http\Controllers\Admin\Blog;

use App\Enums\BlogStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Blog\StoreBlogRequest;
use App\Http\Requests\Admin\Blog\UpdateBlogRequest;
use App\Http\Resources\Admin\Blog\BlogResource;
use App\Models\Blog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Services\Admin\BlogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function __construct(private BlogService $blogs) {}

    public function index(): Response
    {
        return Inertia::render('blogs/index', $this->filterProps());
    }

    public function create(): Response
    {
        return Inertia::render('blogs/create', [
            ...$this->filterProps(),
            'blog' => null,
        ]);
    }

    public function edit(Blog $blog): Response
    {
        $blog->load('category:id,name,slug', 'author.user:id,name,email', 'images');

        return Inertia::render('blogs/create', [
            ...$this->filterProps(),
            'blog' => (new BlogResource($blog))->resolve(),
        ]);
    }

    public function preview(Blog $blog): Response
    {
        $blog->load('category:id,name,slug', 'author.user:id,name,email', 'images');

        return Inertia::render('blogs/preview', [
            'blog' => (new BlogResource($blog))->resolve(),
        ]);
    }

    public function list(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $categoryId = $request->integer('category_id') ?: null;
        $authorId = $request->integer('author_id') ?: null;

        $blogs = Blog::query()
            ->with([
                'category:id,name,slug',
                'author:id,user_id,status',
                'author.user:id,name,email',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($categoryId !== null, fn ($query) => $query->where('category_id', $categoryId))
            ->when($authorId !== null, fn ($query) => $query->where('author_id', $authorId))
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return BlogResource::collection($blogs);
    }

    public function store(StoreBlogRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['featured_image'] = $request->file('featured_image');
        $coverImages = $request->file('cover_images') ?? [];
        $data['cover_images'] = is_array($coverImages) ? $coverImages : [$coverImages];

        $blog = $this->blogs->create($data);

        return response()->json([
            'message' => __('Blog post created successfully.'),
            'blog' => (new BlogResource($blog->load('category', 'author.user', 'images')))->resolve(),
        ], 201);
    }

    public function update(UpdateBlogRequest $request, Blog $blog): JsonResponse
    {
        $data = $request->validated();
        $data['featured_image'] = $request->file('featured_image');
        $coverImages = $request->file('cover_images') ?? [];
        $data['cover_images'] = is_array($coverImages) ? $coverImages : [$coverImages];

        $blog = $this->blogs->update($blog, $data);

        return response()->json([
            'message' => __('Blog post updated successfully.'),
            'blog' => (new BlogResource($blog->load('category', 'author.user', 'images')))->resolve(),
        ]);
    }

    public function markAsDraft(Blog $blog): JsonResponse
    {
        $blog->markAsDraft();

        return response()->json([
            'message' => __('Blog post marked as draft.'),
        ]);
    }

    public function markAsPublished(Blog $blog): JsonResponse
    {
        $blog->markAsPublished();

        return response()->json([
            'message' => __('Blog post marked as published.'),
        ]);
    }

    public function destroy(Blog $blog): JsonResponse
    {
        $this->blogs->delete($blog);

        return response()->json([
            'message' => __('Blog post deleted successfully.'),
        ]);
    }

    /**
     * @return array{categories: mixed, authors: mixed, statuses: list<array{value: string, label: string}>}
     */
    private function filterProps(): array
    {
        return [
            'categories' => BlogCategory::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'authors' => BlogAuthor::query()
                ->with('user:id,name')
                ->where('status', true)
                ->latest()
                ->get()
                ->map(fn (BlogAuthor $author) => [
                    'id' => $author->id,
                    'user_id' => $author->user_id,
                    'name' => $author->user?->name,
                ])
                ->values(),
            'statuses' => collect(BlogStatus::cases())
                ->map(fn (BlogStatus $status) => [
                    'value' => $status->value,
                    'label' => ucfirst($status->value),
                ])
                ->values()
                ->all(),
        ];
    }
}
