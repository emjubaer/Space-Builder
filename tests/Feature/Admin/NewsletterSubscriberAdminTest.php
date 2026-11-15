<?php

use App\Enums\UserRole;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function newsletterAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'newsletter-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit newsletter admin page', function () {
    $this->get(route('admin.website.newsletter.index'))
        ->assertRedirect(route('login'));
});

test('non admin users cannot visit newsletter admin page', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.website.newsletter.index'))
        ->assertForbidden();
});

test('admin can view newsletter subscribers page', function () {
    $admin = newsletterAdminUser();

    $this->actingAs($admin)
        ->get(route('admin.website.newsletter.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('website/newsletter/index'));
});

test('admin can list newsletter subscribers with search and status filter', function () {
    $admin = newsletterAdminUser();

    NewsletterSubscriber::factory()->create(['email' => 'alpha@example.com']);
    NewsletterSubscriber::factory()->inactive()->create(['email' => 'beta@example.com']);

    $this->actingAs($admin)
        ->getJson(route('admin.website.newsletter.list', [
            'search' => 'alpha',
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'alpha@example.com');

    $this->actingAs($admin)
        ->getJson(route('admin.website.newsletter.list', [
            'is_active' => 'false',
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'beta@example.com');
});

test('admin can deactivate and reactivate a subscriber', function () {
    $admin = newsletterAdminUser();
    $subscriber = NewsletterSubscriber::factory()->create([
        'email' => 'toggle@example.com',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.website.newsletter.status', $subscriber), [
            'is_active' => false,
        ])
        ->assertOk()
        ->assertJsonPath('subscriber.is_active', false);

    $this->assertDatabaseHas('newsletter_subscribers', [
        'id' => $subscriber->id,
        'is_active' => false,
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.website.newsletter.status', $subscriber), [
            'is_active' => true,
        ])
        ->assertOk()
        ->assertJsonPath('subscriber.is_active', true);
});

test('admin can delete a newsletter subscriber', function () {
    $admin = newsletterAdminUser();
    $subscriber = NewsletterSubscriber::factory()->create([
        'email' => 'delete-me@example.com',
    ]);

    $this->actingAs($admin)
        ->deleteJson(route('admin.website.newsletter.destroy', $subscriber))
        ->assertOk()
        ->assertJsonPath('message', 'Subscriber deleted successfully.');

    $this->assertDatabaseMissing('newsletter_subscribers', [
        'id' => $subscriber->id,
    ]);
});

test('dashboard includes subscriber stats and recent subscribers', function () {
    $admin = newsletterAdminUser();

    NewsletterSubscriber::factory()->create(['email' => 'dash@example.com']);
    NewsletterSubscriber::factory()->inactive()->create(['email' => 'old@example.com']);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.subscribers', 2)
            ->where('stats.subscribers_active', 1)
            ->has('recentSubscribers', 2));
});
