<?php

namespace App\Services;

use App\Models\Blog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class BlogService
{
    /**
     * @return LengthAwarePaginator<int, Blog>
     */
    public function paginate(?string $search, int $limit): LengthAwarePaginator
    {
        return $this->publishedQuery()
            ->when($search !== null && $search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($limit);
    }

    public function findPublishedBySlug(string $slug): Blog
    {
        return $this->publishedQuery()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /**
     * @return Collection<int, Blog>
     */
    public function related(Blog $blog, int $limit = 4): Collection
    {
        return $this->publishedQuery()
            ->where('category_id', $blog->category_id)
            ->whereKeyNot($blog->getKey())
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @return Builder<Blog>
     */
    private function publishedQuery(): Builder
    {
        return Blog::query()
            ->published()
            ->with([
                'category:id,name,slug',
                'author:id,user_id,slug',
                'author.user:id,name,avatar',
                'coverImages:id,blog_id,image_path,alt_text,caption,sort_order',
            ]);
    }
}
