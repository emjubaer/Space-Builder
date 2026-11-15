<?php

namespace App\Http\Requests\Admin\Property\ConstructionTask;

use App\Enums\ConstructionTaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConstructionTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('property_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::enum(ConstructionTaskStatus::class)],
            'progress_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
