<?php

namespace App\Http\Requests\Admin\Website\Testimonial;

use App\Enums\TestimonialType;
use App\Enums\UserRole;
use App\Enums\VideoProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTestimonialRequest extends FormRequest
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
        $isVideo = $this->input('type') === TestimonialType::Video->value;

        return [
            'type' => ['required', Rule::enum(TestimonialType::class)],
            'reviewer_name' => ['required', 'string', 'max:255'],
            'reviewer_position' => ['nullable', 'string', 'max:255'],
            'reviewer_company' => ['nullable', 'string', 'max:255'],
            'reviewer_avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'content' => ['nullable', 'string'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'video_provider' => [
                $isVideo ? 'required' : 'nullable',
                Rule::enum(VideoProvider::class),
            ],
            'video_id' => [
                Rule::requiredIf(
                    $isVideo && in_array($this->input('video_provider'), [
                        VideoProvider::Youtube->value,
                        VideoProvider::Vimeo->value,
                    ], true),
                ),
                'nullable',
                'string',
                'max:255',
            ],
            'video_url' => [
                Rule::requiredIf(
                    $isVideo && $this->input('video_provider') === VideoProvider::SelfHosted->value,
                ),
                'nullable',
                'url',
                'max:2048',
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
