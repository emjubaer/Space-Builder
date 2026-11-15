<?php

use App\Enums\ReferralSource;
use App\Enums\ReferralStatus;
use App\Models\Referral;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('guests cannot list referrals', function () {
    $this->getJson(route('api.referrals.index'))->assertUnauthorized();
});

test('guests cannot view referral summary', function () {
    $this->getJson(route('api.referrals.summary'))->assertUnauthorized();
});

test('guests cannot add referrals via authenticated store', function () {
    $this->postJson(route('api.referrals.store'), [
        'referred_name' => 'Rifat Ahamed',
        'referred_phone' => '01400715037',
    ])->assertUnauthorized();
});

test('authenticated users can add a referral with source manual', function () {
    $user = User::factory()->create([
        'referral_code' => 'ngm84gf1',
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson(route('api.referrals.store'), [
        'referred_name' => 'Rifat Ahamed',
        'referred_phone' => '+8801400715037',
        'note' => 'Lorem Ipsum',
        'permission_confirmed' => true,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.referred_name', 'Rifat Ahamed')
        ->assertJsonPath('data.referred_phone', '+8801400715037')
        ->assertJsonPath('data.status', ReferralStatus::Unverified->value)
        ->assertJsonPath('data.source', ReferralSource::Manual->value)
        ->assertJsonPath('data.note', 'Lorem Ipsum');

    $this->assertDatabaseHas('referrals', [
        'referrer_id' => $user->id,
        'referred_name' => 'Rifat Ahamed',
        'referred_phone' => '+8801400715037',
        'status' => ReferralStatus::Unverified->value,
        'source' => ReferralSource::Manual->value,
    ]);
});

test('adding a referral requires name phone and permission confirmed', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('api.referrals.store'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['referred_name', 'referred_phone', 'permission_confirmed']);
});

test('adding a referral rejects false permission confirmed', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('api.referrals.store'), [
        'referred_name' => 'Rifat Ahamed',
        'referred_phone' => '+8801400715099',
        'permission_confirmed' => false,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['permission_confirmed']);
});

test('guests can add a referral via referral code with source link', function () {
    $user = User::factory()->create([
        'referral_code' => 'ngm84gf1',
    ]);

    $response = $this->postJson(route('api.referrals.store-by-code', [
        'referralCode' => 'ngm84gf1',
    ]), [
        'referred_name' => 'Link Lead',
        'referred_phone' => '+8801400715038',
        'note' => 'From shared link',
        'permission_confirmed' => true,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.referred_name', 'Link Lead')
        ->assertJsonPath('data.source', ReferralSource::Link->value)
        ->assertJsonPath('data.status', ReferralStatus::Unverified->value);

    $this->assertDatabaseHas('referrals', [
        'referrer_id' => $user->id,
        'referred_name' => 'Link Lead',
        'source' => ReferralSource::Link->value,
    ]);
});

test('public referral by code returns 404 for unknown code', function () {
    $this->postJson(route('api.referrals.store-by-code', [
        'referralCode' => 'missing1',
    ]), [
        'referred_name' => 'Nobody',
        'referred_phone' => '01700000000',
        'permission_confirmed' => true,
    ])
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('status', 404)
        ->assertJsonPath(
            'message',
            'Invalid referral link. No referrer was found for this code.',
        );
});

test('duplicate phone within two months is rejected on authenticated store', function () {
    Referral::factory()->create([
        'referred_phone' => '+8801400715111',
        'created_at' => now()->subMonth(),
    ]);

    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('api.referrals.store'), [
        'referred_name' => 'Duplicate Lead',
        'referred_phone' => '+8801400715111',
        'permission_confirmed' => true,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['referred_phone']);
});

test('duplicate phone within two months is rejected on public store by code', function () {
    User::factory()->create([
        'referral_code' => 'ngm84gf1',
    ]);

    Referral::factory()->create([
        'referred_phone' => '+8801400715222',
        'created_at' => now()->subWeeks(3),
    ]);

    $this->postJson(route('api.referrals.store-by-code', [
        'referralCode' => 'ngm84gf1',
    ]), [
        'referred_name' => 'Duplicate Link Lead',
        'referred_phone' => '+8801400715222',
        'permission_confirmed' => true,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['referred_phone']);
});

test('same phone older than two months is allowed', function () {
    Referral::factory()->create([
        'referred_phone' => '+8801400715333',
        'created_at' => now()->subMonths(2)->subDay(),
        'updated_at' => now()->subMonths(2)->subDay(),
    ]);

    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('api.referrals.store'), [
        'referred_name' => 'Allowed Again',
        'referred_phone' => '+8801400715333',
        'permission_confirmed' => true,
    ])->assertCreated();
});

test('authenticated users can list their referrals with user id and name', function () {
    $user = User::factory()->create([
        'name' => 'Rifat Ahamed',
        'referral_code' => 'ngm84gf1',
    ]);

    Referral::factory()->count(2)->create([
        'referrer_id' => $user->id,
        'status' => ReferralStatus::Unverified,
    ]);

    Referral::factory()->verified()->create([
        'referrer_id' => $user->id,
        'referred_name' => 'Verified Person',
    ]);

    Referral::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->getJson(route('api.referrals.index'));

    $response
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.name', 'Rifat Ahamed')
        ->assertJsonCount(3, 'data.referrals')
        ->assertJsonMissingPath('data.stats')
        ->assertJsonMissingPath('data.referral_code');
});

test('authenticated users can view referral summary with lean user and stats', function () {
    $user = User::factory()->create([
        'name' => 'Rifat Ahamed',
        'email' => 'rifat@example.com',
        'mobile' => '01400715037',
        'referral_code' => 'ngm84gf1',
    ]);

    Referral::factory()->count(2)->create([
        'referrer_id' => $user->id,
        'status' => ReferralStatus::Unverified,
    ]);

    Referral::factory()->verified()->create([
        'referrer_id' => $user->id,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson(route('api.referrals.summary'));

    $response
        ->assertOk()
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.name', 'Rifat Ahamed')
        ->assertJsonPath('data.user.email', 'rifat@example.com')
        ->assertJsonPath('data.user.mobile', '01400715037')
        ->assertJsonPath(
            'data.user.referral_link',
            rtrim((string) config('app.url'), '/').'/ref/ngm84gf1',
        )
        ->assertJsonPath('data.stats.total_referrals', 3)
        ->assertJsonPath('data.stats.total_successful', 1)
        ->assertJsonPath('data.stats.total_in_progress', 2)
        ->assertJsonPath('data.stats.total_rewards_earned', 0)
        ->assertJsonMissingPath('data.user.avatar')
        ->assertJsonMissingPath('data.user.referral_code')
        ->assertJsonMissingPath('data.user.referred_by')
        ->assertJsonMissingPath('data.user.email_verified_at')
        ->assertJsonMissingPath('data.user.created_at')
        ->assertJsonMissingPath('data.user.updated_at')
        ->assertJsonMissingPath('data.referrals');
});
