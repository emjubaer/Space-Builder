<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexBlogsRequest;
use App\Http\Requests\Api\RelatedBlogsRequest;
use App\Http\Resources\Api\BlogResource;
use App\Http\Resources\Api\BlogSummaryResource;
use App\Services\BlogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BlogController extends Controller
{
    public function __construct(private BlogService $blogs) {}

    public function index(IndexBlogsRequest $request): AnonymousResourceCollection
    {
        $blogs = $this->blogs->paginate(
            $request->search(),
            $request->limit(),
        );

        return BlogSummaryResource::collection($blogs);
    }

    public function show(string $slug): JsonResponse
    {
        $blog = $this->blogs->findPublishedBySlug($slug);

        return response()->json([
            'data' => (new BlogResource($blog))->resolve(),
        ]);
    }

    public function related(RelatedBlogsRequest $request, string $slug): JsonResponse
    {
        $blog = $this->blogs->findPublishedBySlug($slug);
        $related = $this->blogs->related($blog, $request->limit());

        return response()->json([
            'data' => BlogSummaryResource::collection($related)->resolve(),
        ]);
    }
}
