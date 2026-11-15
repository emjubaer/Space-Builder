<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'referred_name' => ['required', 'string', 'max:255'],
            'referred_phone' => ['required', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:5000'],
            'permission_confirmed' => ['required', 'accepted'],
        ];
    }
}
