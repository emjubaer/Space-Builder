<?php

namespace App\Services\Admin;

use App\Models\BlogCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BlogCategoryService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): BlogCategory
    {
        $slug = filled($data['slug'] ?? null)
            ? BlogCategory::generateUniqueSlug($data['slug'])
            : BlogCategory::generateUniqueSlug($data['name']);

        return BlogCategory::create([
            'name' => $data['name'],
            'slug' => $slug,
            'image' => $this->storeImage($data['image'] ?? null),
            'description' => $data['description'] ?? null,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(BlogCategory $category, array $data): BlogCategory
    {
        $slug = filled($data['slug'] ?? null)
            ? BlogCategory::generateUniqueSlug($data['slug'], $category->id)
            : $category->slug;

        $image = $category->image;

        if (($data['image'] ?? null) instanceof UploadedFile) {
            $this->deleteImage($category->image);
            $image = $this->storeImage($data['image']);
        }

        $category->update([
            'name' => $data['name'],
            'slug' => $slug,
            'image' => $image,
            'description' => $data['description'] ?? null,
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : $category->is_active,
        ]);

        return $category->refresh();
    }

    public function delete(BlogCategory $category): void
    {
        if ($category->blogs()->exists()) {
            throw ValidationException::withMessages([
                'category' => __('Category has blog posts and cannot be deleted.'),
            ]);
        }

        $this->deleteImage($category->image);
        $category->delete();
    }

    private function storeImage(mixed $image): ?string
    {
        if (! $image instanceof UploadedFile) {
            return null;
        }

        return $image->store('blog-categories', 'public');
    }

    private function deleteImage(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
