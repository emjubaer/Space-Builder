<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('users can register via the api', function () {
    $response = $this->postJson(route('api.register'), [
        'email' => 'api@example.com',
        'mobile' => '01700000000',
        'password' => 'password',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('user.email', 'api@example.com')
        ->assertJsonPath('user.mobile', '01700000000')
        ->assertJsonStructure([
            'message',
            'token',
            'user' => ['id', 'name', 'email', 'mobile', 'email_verified_at', 'created_at', 'updated_at'],
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'api@example.com',
        'mobile' => '01700000000',
    ]);
});

test('registration requires email mobile and password', function () {
    $this->postJson(route('api.register'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'mobile', 'password']);
});

test('users can login via the api', function () {
    $user = User::factory()->create([
        'email' => 'login@example.com',
        'password' => 'password',
    ]);

    $response = $this->postJson(route('api.login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('user.email', $user->email)
        ->assertJsonStructure(['message', 'token', 'user']);
});

test('login returns 401 for invalid credentials', function () {
    $user = User::factory()->create();

    $this->postJson(route('api.login'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertUnauthorized();
});

test('users can logout via the api', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api')->plainTextToken;

    $this->withToken($token)
        ->postJson(route('api.logout'))
        ->assertOk()
        ->assertJsonPath('message', 'Logged out successfully.');

    $this->assertDatabaseCount('personal_access_tokens', 0);
});

test('logout returns 401 when unauthenticated', function () {
    $this->postJson(route('api.logout'))->assertUnauthorized();
});

test('forgot password sends a reset link notification', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson(route('api.password.email'), [
        'email' => $user->email,
    ])
        ->assertOk()
        ->assertJsonPath('message', 'A reset link will be sent if the account exists.');

    Notification::assertSentTo($user, ResetPassword::class);
});

test('forgot password returns a generic message for unknown emails', function () {
    Notification::fake();

    $this->postJson(route('api.password.email'), [
        'email' => 'missing@example.com',
    ])
        ->assertOk()
        ->assertJsonPath('message', 'A reset link will be sent if the account exists.');

    Notification::assertNothingSent();
});

test('password can be reset via the api', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson(route('api.password.email'), [
        'email' => $user->email,
    ])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $user->createToken('api');

        $response = $this->postJson(route('api.password.update'), [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
        ]);

        $response->assertOk();

        expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
        expect($user->fresh()->tokens)->toHaveCount(0);

        return true;
    });
});

test('password cannot be reset with an invalid token', function () {
    $user = User::factory()->create();

    $this->postJson(route('api.password.update'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'new-password',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});
