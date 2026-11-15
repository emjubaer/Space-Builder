<?php

namespace App\Http\Requests\Admin\Blog\Author;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreBlogAuthorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('blog_author_create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isExistingUser = filled($this->input('user_id'));

        return [
            'user_id' => [
                $isExistingUser ? 'required' : 'nullable',
                'integer',
                Rule::exists(User::class, 'id'),
                Rule::unique('blog_authors', 'user_id'),
            ],
            'name' => [$isExistingUser ? 'nullable' : 'required', 'string', 'max:255'],
            'email' => [
                $isExistingUser ? 'nullable' : 'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'mobile' => [
                $isExistingUser ? 'nullable' : 'required',
                'string',
                'max:20',
                Rule::unique(User::class),
            ],
            'password' => [$isExistingUser ? 'nullable' : 'required', 'string', Password::default(), 'confirmed'],
            'avatar' => [$isExistingUser ? 'nullable' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'bio' => ['nullable', 'string'],
            'designation' => ['nullable', 'string', 'max:255'],
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
