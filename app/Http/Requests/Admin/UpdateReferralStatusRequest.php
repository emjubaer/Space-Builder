<?php

namespace App\Http\Requests\Admin;

use App\Enums\ReferralStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReferralStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('referral_update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ReferralStatus::class)],
            'reward_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('reward_amount') === '') {
            $this->merge(['reward_amount' => null]);
        }
    }
}
