<?php

namespace App\Models;

use App\Enums\ConstructionTaskStatus;
use Database\Factories\ConstructionTaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'property_id',
    'title',
    'description',
    'status',
    'progress_percentage',
    'sort_order',
])]
class ConstructionTask extends Model
{
    /** @use HasFactory<ConstructionTaskFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ConstructionTaskStatus::class,
            'progress_percentage' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function syncStatusFromProgress(): void
    {
        if ($this->status === ConstructionTaskStatus::OnHold) {
            return;
        }

        $progress = (float) $this->progress_percentage;

        if ($progress >= 100) {
            $this->status = ConstructionTaskStatus::Completed;
            $this->progress_percentage = 100;

            return;
        }

        if ($progress > 0) {
            $this->status = ConstructionTaskStatus::InProgress;

            return;
        }

        $this->status = ConstructionTaskStatus::Pending;
    }
}
