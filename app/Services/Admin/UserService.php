<?php

namespace App\Services\Admin;

use App\Models\User;
use Spatie\Permission\Models\Role;

class UserService
{
    /**
     * @param  array{name: string, email: string, mobile: string, password: string, roles?: list<int>}  $data
     */
    public function create(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'mobile' => $data['mobile'],
            'password' => $data['password'],
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($this->roleNames($data['roles'] ?? []));

        return $user;
    }

    /**
     * @param  array{name: string, email: string, mobile: string, roles?: list<int>}  $data
     */
    public function update(User $user, array $data): User
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'mobile' => $data['mobile'],
        ]);

        $user->syncRoles($this->roleNames($data['roles'] ?? []));

        return $user->refresh();
    }

    public function delete(User $user): void
    {
        $user->roles()->detach();
        $user->permissions()->detach();
        $user->tokens()->delete();
        $user->delete();
    }

    public function changePassword(User $user, string $password): void
    {
        $user->update([
            'password' => $password,
        ]);
    }

    /**
     * @param  list<int>  $roleIds
     * @return list<string>
     */
    private function roleNames(array $roleIds): array
    {
        if ($roleIds === []) {
            return [];
        }

        return Role::query()
            ->whereIn('id', $roleIds)
            ->pluck('name')
            ->all();
    }
}
