<?php

namespace App\Services\Admin;

use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TestimonialService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $user): Testimonial
    {
        return Testimonial::query()->create([
            'created_by' => $user->id,
            'type' => $data['type'],
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : true,
            'reviewer_name' => $data['reviewer_name'],
            'reviewer_position' => $data['reviewer_position'] ?? null,
            'reviewer_company' => $data['reviewer_company'] ?? null,
            'reviewer_avatar' => $this->storeAvatar($data['reviewer_avatar'] ?? null),
            'content' => $data['content'] ?? null,
            'rating' => $data['rating'] ?? null,
            'video_provider' => $data['video_provider'] ?? null,
            'video_id' => $data['video_id'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'published_at' => $data['published_at'] ?? now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Testimonial $testimonial, array $data): Testimonial
    {
        $avatar = $testimonial->reviewer_avatar;

        if (($data['remove_avatar'] ?? false) && $this->toBoolean($data['remove_avatar'])) {
            $this->deleteAvatar($testimonial->reviewer_avatar);
            $avatar = null;
        }

        if (($data['reviewer_avatar'] ?? null) instanceof UploadedFile) {
            $this->deleteAvatar($testimonial->reviewer_avatar);
            $avatar = $this->storeAvatar($data['reviewer_avatar']);
        }

        $testimonial->update([
            'type' => $data['type'],
            'is_active' => array_key_exists('is_active', $data)
                ? $this->toBoolean($data['is_active'])
                : $testimonial->is_active,
            'reviewer_name' => $data['reviewer_name'],
            'reviewer_position' => $data['reviewer_position'] ?? null,
            'reviewer_company' => $data['reviewer_company'] ?? null,
            'reviewer_avatar' => $avatar,
            'content' => $data['content'] ?? null,
            'rating' => $data['rating'] ?? null,
            'video_provider' => $data['video_provider'] ?? null,
            'video_id' => $data['video_id'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? $testimonial->sort_order,
            'published_at' => array_key_exists('published_at', $data)
                ? $data['published_at']
                : $testimonial->published_at,
        ]);

        return $testimonial->refresh();
    }

    public function delete(Testimonial $testimonial): void
    {
        $this->deleteAvatar($testimonial->reviewer_avatar);
        $testimonial->delete();
    }

    private function storeAvatar(mixed $avatar): ?string
    {
        if (! $avatar instanceof UploadedFile) {
            return null;
        }

        return $avatar->store('testimonials', 'public');
    }

    private function deleteAvatar(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
