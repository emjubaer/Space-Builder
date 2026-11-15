<?php

use App\Enums\ReferralRewardStatus;
use App\Enums\ReferralStatus;
use App\Enums\UserRole;
use App\Models\Referral;
use App\Models\ReferralReward;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function referralAdmin(): User
{
    $user = User::factory()->create([
        'email' => 'admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit referrals page', function () {
    $this->get(route('admin.referrals.index'))->assertRedirect(route('login'));
});

test('non admin users cannot visit referrals page', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.referrals.index'))
        ->assertForbidden();
});

test('admin can view referrals page', function () {
    $this->actingAs(referralAdmin())
        ->get(route('admin.referrals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('referrals/index')
            ->has('statuses'));
});

test('admin can list referrals grouped by referrer', function () {
    $admin = referralAdmin();
    $referrer = User::factory()->create(['name' => 'Referrer One']);
    $other = User::factory()->create(['name' => 'Other Referrer']);

    Referral::factory()->count(2)->create([
        'referrer_id' => $referrer->id,
        'status' => ReferralStatus::Unverified,
    ]);
    Referral::factory()->verified()->create([
        'referrer_id' => $referrer->id,
    ]);
    Referral::factory()->create([
        'referrer_id' => $other->id,
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('admin.referrals.list'));

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'referrer' => ['id', 'name', 'email', 'mobile'],
                    'referrals_count',
                    'verified_count',
                    'referrals',
                ],
            ],
            'meta',
        ]);

    $group = collect($response->json('data'))
        ->firstWhere('referrer.id', $referrer->id);

    expect($group)->not->toBeNull()
        ->and($group['referrals_count'])->toBe(3)
        ->and($group['verified_count'])->toBe(1)
        ->and($group['referrals'])->toHaveCount(3);
});

test('admin can filter referral groups by status', function () {
    $admin = referralAdmin();
    $referrer = User::factory()->create();

    Referral::factory()->create([
        'referrer_id' => $referrer->id,
        'status' => ReferralStatus::Unverified,
    ]);
    Referral::factory()->verified()->create([
        'referrer_id' => $referrer->id,
        'referred_name' => 'Verified Lead',
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('admin.referrals.list', [
            'status' => ReferralStatus::Verified->value,
        ]));

    $response->assertOk();

    $group = collect($response->json('data'))
        ->firstWhere('referrer.id', $referrer->id);

    expect($group)->not->toBeNull()
        ->and($group['referrals_count'])->toBe(1)
        ->and($group['referrals'])->toHaveCount(1)
        ->and($group['referrals'][0]['referred_name'])->toBe('Verified Lead')
        ->and($group['referrals'][0]['status'])->toBe(ReferralStatus::Verified->value);
});

test('admin can search referral groups by referred name', function () {
    $admin = referralAdmin();
    $matching = User::factory()->create(['name' => 'Alpha Referrer']);
    $other = User::factory()->create(['name' => 'Beta Referrer']);

    Referral::factory()->create([
        'referrer_id' => $matching->id,
        'referred_name' => 'Unique Lead Person',
    ]);
    Referral::factory()->create([
        'referrer_id' => $other->id,
        'referred_name' => 'Someone Else',
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('admin.referrals.list', [
            'search' => 'Unique Lead',
        ]));

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('referrer.id');

    expect($ids)->toContain($matching->id)
        ->and($ids)->not->toContain($other->id);
});

test('admin can update referral status without reward', function () {
    $admin = referralAdmin();
    $referral = Referral::factory()->create([
        'status' => ReferralStatus::Unverified,
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.referrals.status', $referral), [
            'status' => ReferralStatus::Verified->value,
        ])
        ->assertOk()
        ->assertJsonPath('referral.status', ReferralStatus::Verified->value);

    $this->assertDatabaseHas('referrals', [
        'id' => $referral->id,
        'status' => ReferralStatus::Verified->value,
    ]);

    expect(ReferralReward::query()->where('referral_id', $referral->id)->exists())->toBeFalse();
});

test('admin can update referral status with reward amount', function () {
    $admin = referralAdmin();
    $referral = Referral::factory()->create([
        'status' => ReferralStatus::Unverified,
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.referrals.status', $referral), [
            'status' => ReferralStatus::Verified->value,
            'reward_amount' => 250.5,
        ])
        ->assertOk()
        ->assertJsonPath('referral.status', ReferralStatus::Verified->value)
        ->assertJsonPath('referral.reward.amount', '250.50')
        ->assertJsonPath('referral.reward.status', ReferralRewardStatus::Earned->value);

    $this->assertDatabaseHas('referral_rewards', [
        'referral_id' => $referral->id,
        'amount' => 250.5,
        'status' => ReferralRewardStatus::Earned->value,
    ]);
});

test('admin can update existing reward amount when changing status', function () {
    $admin = referralAdmin();
    $referral = Referral::factory()->verified()->create();
    ReferralReward::query()->create([
        'referral_id' => $referral->id,
        'amount' => 100,
        'status' => ReferralRewardStatus::Earned,
        'earned_at' => now(),
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.referrals.status', $referral), [
            'status' => ReferralStatus::Verified->value,
            'reward_amount' => 400,
        ])
        ->assertOk()
        ->assertJsonPath('referral.reward.amount', '400.00');

    expect(ReferralReward::query()->where('referral_id', $referral->id)->count())->toBe(1)
        ->and((float) ReferralReward::query()->where('referral_id', $referral->id)->value('amount'))->toBe(400.0);
});

test('guests cannot update referral status', function () {
    $referral = Referral::factory()->create();

    $this->putJson(route('admin.referrals.status', $referral), [
        'status' => ReferralStatus::Verified->value,
    ])->assertUnauthorized();
});

test('staff without permission cannot update referral status', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);
    $referral = Referral::factory()->create();

    $this->actingAs($user)
        ->putJson(route('admin.referrals.status', $referral), [
            'status' => ReferralStatus::Verified->value,
        ])
        ->assertForbidden();
});
