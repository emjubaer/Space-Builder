<?php

namespace App\Http\Requests\Admin\Blog;

use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBlogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('blog_create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'html_content' => ['nullable', 'string'],
            'category_id' => ['required', 'integer', Rule::exists(BlogCategory::class, 'id')],
            'author_id' => ['required', 'integer', Rule::exists(BlogAuthor::class, 'id')],
            'featured_image' => ['nullable', 'image', 'max:4096'],
            'cover_images' => ['nullable', 'array'],
            'cover_images.*' => ['image', 'max:4096'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'publish' => ['sometimes', 'boolean'],
        ];
    }
}
