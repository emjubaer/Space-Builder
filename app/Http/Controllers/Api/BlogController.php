<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexBlogsRequest;
use App\Http\Requests\Api\RelatedBlogsRequest;
use App\Http\Resources\Api\BlogResource;
use App\Http\Resources\Api\BlogSummaryResource;
use App\Services\BlogService;
use Illuminate\Http\JsonResponse;

class BlogController extends Controller
{
    public function __construct(private BlogService $blogs) {}

    public function index(IndexBlogsRequest $request): JsonResponse
    {
        $paginator = $this->blogs->paginate(
            $request->search(),
            $request->limit(),
        );

        return $this->success(
            'Blogs retrieved.',
            200,
            BlogSummaryResource::collection($paginator)->resolve(),
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
        $blog = $this->blogs->findPublishedBySlug($slug);

        return $this->success(
            'Blog retrieved.',
            200,
            (new BlogResource($blog))->resolve(),
        );
    }

    public function related(RelatedBlogsRequest $request, string $slug): JsonResponse
    {
        $blog = $this->blogs->findPublishedBySlug($slug);
        $related = $this->blogs->related($blog, $request->limit());

        return $this->success(
            'Related blogs retrieved.',
            200,
            BlogSummaryResource::collection($related)->resolve(),
        );
    }
}
