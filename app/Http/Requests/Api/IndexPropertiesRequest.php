<?php

namespace App\Http\Requests\Api;

use App\Enums\PropertyStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPropertiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'property_type_id' => ['sometimes', 'integer', 'exists:property_types,id'],
            'location_id' => ['sometimes', 'integer', 'exists:locations,id'],
            'status' => ['sometimes', 'string', Rule::enum(PropertyStatus::class)->except(PropertyStatus::Draft)],
        ];
    }

    public function limit(): int
    {
        return (int) ($this->validated('limit') ?? 15);
    }

    public function propertyTypeId(): ?int
    {
        $value = $this->validated('property_type_id');

        return $value !== null ? (int) $value : null;
    }

    public function locationId(): ?int
    {
        $value = $this->validated('location_id');

        return $value !== null ? (int) $value : null;
    }

    public function status(): ?PropertyStatus
    {
        $value = $this->validated('status');

        if ($value === null) {
            return null;
        }

        return $value instanceof PropertyStatus
            ? $value
            : PropertyStatus::from((string) $value);
    }
}
