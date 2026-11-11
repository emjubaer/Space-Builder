<?php

namespace App\Http\Requests\Admin\Blog\Author;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogAuthorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(UserRole::Admin) ?? false;
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
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
