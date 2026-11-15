<?php

namespace App\Http\Requests\Admin\Website;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNewsletterSubscriberStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('newsletter_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'is_active' => ['required', 'boolean'],
        ];
    }
}
