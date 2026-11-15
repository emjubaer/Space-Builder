<?php

namespace App\Http\Requests\Admin\Property\ConstructionTask;

use App\Enums\ConstructionTaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConstructionTaskProgressRequest extends FormRequest
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
            'progress_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', Rule::enum(ConstructionTaskStatus::class)],
        ];
    }
}
