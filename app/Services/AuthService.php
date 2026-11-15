<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user and issue an API token.
     *
     * @param  array{name: string, email: string, mobile: string, password: string, referral_code?: string|null}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $referredBy = null;

        if (! empty($data['referral_code'])) {
            $referrer = User::query()
                ->where('referral_code', $data['referral_code'])
                ->first();

            if ($referrer !== null) {
                $referredBy = $referrer->id;
            }
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'mobile' => $data['mobile'],
            'password' => $data['password'],
            'referral_code' => $this->generateUniqueReferralCode(),
            'referred_by' => $referredBy,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate a user and issue an API token.
     *
     * @return array{user: User, token: string}
     *
     * @throws AuthenticationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw new AuthenticationException(__('auth.failed'));
        }

        $token = $user->createToken('api')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Send a password reset link when the account exists.
     */
    public function forgotPassword(string $email): string
    {
        Password::sendResetLink(['email' => $email]);

        return __('A reset link will be sent if the account exists.');
    }

    /**
     * Reset the user's password using a valid reset token.
     *
     * @param  array{email: string, password: string, token: string}  $data
     *
     * @throws ValidationException
     */
    public function resetPassword(array $data): string
    {
        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    private function generateUniqueReferralCode(): string
    {
        do {
            $code = strtolower(Str::random(8));
        } while (User::query()->where('referral_code', $code)->exists());

        return $code;
    }
}
