<?php

namespace App\Services\Admin;

use App\Enums\UserRole;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BlogAuthorService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $createdBy): BlogAuthor
    {
        return DB::transaction(function () use ($data, $createdBy): BlogAuthor {
            if (! empty($data['user_id'])) {
                $user = User::query()->findOrFail($data['user_id']);

                if ($user->blogAuthor()->withTrashed()->exists()) {
                    throw ValidationException::withMessages([
                        'user_id' => __('This user already has an author profile.'),
                    ]);
                }

                $author = $user->blogAuthor()->create([
                    'slug' => BlogAuthor::generateUniqueSlug($user->name ?: 'author'),
                    'bio' => $data['bio'] ?? null,
                    'designation' => $data['designation'] ?? null,
                    'social_links' => $data['social_links'] ?? null,
                    'status' => true,
                    'created_by' => $createdBy->id,
                ]);

                if (! $user->hasRole(UserRole::Author)) {
                    $user->assignRole(UserRole::Author);
                }

                return $author;
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'mobile' => $data['mobile'],
                'avatar' => $this->storeAvatar($data['avatar'] ?? null),
                'password' => $data['password'],
                'email_verified_at' => now(),
            ]);

            $user->assignRole(UserRole::Author);

            return $user->blogAuthor()->create([
                'slug' => BlogAuthor::generateUniqueSlug($data['name']),
                'bio' => $data['bio'] ?? null,
                'designation' => $data['designation'] ?? null,
                'social_links' => $data['social_links'] ?? null,
                'status' => true,
                'created_by' => $createdBy->id,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(BlogAuthor $author, array $data): BlogAuthor
    {
        $author->update([
            'bio' => $data['bio'] ?? null,
            'designation' => $data['designation'] ?? null,
            'social_links' => $data['social_links'] ?? null,
            'status' => array_key_exists('status', $data)
                ? filter_var($data['status'], FILTER_VALIDATE_BOOLEAN)
                : $author->status,
        ]);

        return $author->refresh();
    }

    public function delete(BlogAuthor $author): void
    {
        if ($author->hasBlogs()) {
            throw ValidationException::withMessages([
                'author' => __('Author has blog posts and cannot be deleted.'),
            ]);
        }

        $author->delete();
    }

    private function storeAvatar(mixed $avatar): ?string
    {
        if (! $avatar instanceof UploadedFile) {
            return null;
        }

        return $avatar->store('avatars', 'public');
    }
}
