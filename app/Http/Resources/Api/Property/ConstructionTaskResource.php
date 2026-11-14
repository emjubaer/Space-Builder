<?php

namespace App\Http\Resources\Api\Property;

use App\Models\ConstructionTask;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ConstructionTask
 */
class ConstructionTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status?->value ?? $this->status,
            'status_label' => $this->status?->label(),
            'progress_percentage' => (float) $this->progress_percentage,
            'sort_order' => $this->sort_order,
        ];
    }
}
