<?php

namespace App\Http\Requests\Admin\Property\ConstructionTask;

use App\Enums\ConstructionTaskStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConstructionTaskProgressRequest extends FormRequest
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
            'progress_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', Rule::enum(ConstructionTaskStatus::class)],
        ];
    }
}
