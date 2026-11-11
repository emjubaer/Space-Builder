<?php

namespace App\Services\Admin;

use App\Enums\BlogStatus;
use App\Models\Blog;
use App\Models\BlogImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BlogService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Blog
    {
        return DB::transaction(function () use ($data): Blog {
            $slug = filled($data['slug'] ?? null)
                ? Blog::generateUniqueSlug($data['slug'])
                : Blog::generateUniqueSlug($data['title']);

            $html = $data['html_content'] ?? null;

            $blog = Blog::create([
                'category_id' => $data['category_id'],
                'author_id' => $data['author_id'],
                'title' => $data['title'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'html_content' => $html,
                'featured_image' => $this->storeImage($data['featured_image'] ?? null, 'blog-featured'),
                'reading_time' => Blog::estimateReadingTime($html),
                'status' => BlogStatus::Draft,
                'meta_title' => $data['meta_title'] ?? null,
                'meta_description' => $data['meta_description'] ?? null,
            ]);

            $this->syncCoverImages($blog, $data['cover_images'] ?? [], []);

            if (array_key_exists('publish', $data) && filter_var($data['publish'], FILTER_VALIDATE_BOOLEAN)) {
                $blog->markAsPublished();
            }

            return $blog->refresh()->load('images');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Blog $blog, array $data): Blog
    {
        return DB::transaction(function () use ($blog, $data): Blog {
            $slug = filled($data['slug'] ?? null)
                ? Blog::generateUniqueSlug($data['slug'], $blog->id)
                : $blog->slug;

            $html = array_key_exists('html_content', $data)
                ? $data['html_content']
                : $blog->html_content;

            $featuredImage = $blog->featured_image;

            if (($data['featured_image'] ?? null) instanceof UploadedFile) {
                $this->deleteImage($blog->featured_image);
                $featuredImage = $this->storeImage($data['featured_image'], 'blog-featured');
            } elseif (
                array_key_exists('remove_featured_image', $data)
                && filter_var($data['remove_featured_image'], FILTER_VALIDATE_BOOLEAN)
            ) {
                $this->deleteImage($blog->featured_image);
                $featuredImage = null;
            }

            $blog->update([
                'category_id' => $data['category_id'] ?? $blog->category_id,
                'author_id' => $data['author_id'] ?? $blog->author_id,
                'title' => $data['title'] ?? $blog->title,
                'slug' => $slug,
                'description' => array_key_exists('description', $data) ? $data['description'] : $blog->description,
                'html_content' => $html,
                'featured_image' => $featuredImage,
                'reading_time' => Blog::estimateReadingTime($html),
                'meta_title' => array_key_exists('meta_title', $data) ? $data['meta_title'] : $blog->meta_title,
                'meta_description' => array_key_exists('meta_description', $data) ? $data['meta_description'] : $blog->meta_description,
            ]);

            /** @var list<int> $keepIds */
            $keepIds = array_map('intval', $data['existing_cover_ids'] ?? []);
            $this->syncCoverImages($blog, $data['cover_images'] ?? [], $keepIds);

            if (array_key_exists('publish', $data)) {
                if (filter_var($data['publish'], FILTER_VALIDATE_BOOLEAN)) {
                    $blog->markAsPublished();
                } else {
                    $blog->markAsDraft();
                }
            }

            return $blog->refresh()->load('images');
        });
    }

    public function delete(Blog $blog): void
    {
        foreach ($blog->images as $image) {
            $this->deleteImage($image->image_path);
        }

        $this->deleteImage($blog->featured_image);
        $blog->delete();
    }

    /**
     * @param  list<UploadedFile|mixed>  $newFiles
     * @param  list<int>  $keepIds
     */
    private function syncCoverImages(Blog $blog, array $newFiles, array $keepIds): void
    {
        $existingCovers = $blog->images()
            ->where('image_type', 'cover')
            ->get();

        foreach ($existingCovers as $cover) {
            if (! in_array($cover->id, $keepIds, true)) {
                $this->deleteImage($cover->image_path);
                $cover->delete();
            }
        }

        $sortOrder = (int) $blog->images()->where('image_type', 'cover')->max('sort_order');

        foreach ($newFiles as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $sortOrder++;

            BlogImage::create([
                'blog_id' => $blog->id,
                'blog_section_id' => null,
                'image_path' => $this->storeImage($file, 'blog-covers'),
                'image_type' => 'cover',
                'alt_text' => null,
                'caption' => null,
                'sort_order' => $sortOrder,
            ]);
        }
    }

    private function storeImage(mixed $image, string $directory): ?string
    {
        if (! $image instanceof UploadedFile) {
            return null;
        }

        return $image->store($directory, 'public');
    }

    private function deleteImage(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
