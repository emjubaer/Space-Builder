<?php

namespace App\Http\Requests\Admin\Property\Feature;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('property_feature_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
