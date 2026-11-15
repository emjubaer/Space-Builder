<?php

namespace App\Http\Requests\Admin\Blog\Author;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogAuthorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('blog_author_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string'],
            'designation' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
