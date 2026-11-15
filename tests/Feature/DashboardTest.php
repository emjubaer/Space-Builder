<?php

use App\Enums\UserRole;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\Property;
use App\Models\Referral;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function dashboardUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users without dashboard permission cannot visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertForbidden();
});

test('authenticated users with permission can visit the dashboard', function () {
    $user = dashboardUser();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('stats')
        ->has('analytics')
        ->has('recentProperties')
        ->has('recentContacts')
        ->has('constructionHighlights')
        ->where('stats.properties', 0)
        ->where('stats.contacts_new', 0)
        ->has('analytics.series')
        ->has('analytics.seriesKeys')
    );
});

test('dashboard includes recent contact messages', function () {
    $user = dashboardUser();
    ContactMessage::factory()->create([
        'first_name' => 'Recent',
        'last_name' => 'Contact',
        'subject' => 'Hello dashboard',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('recentContacts', 1)
            ->where('recentContacts.0.full_name', 'Recent Contact')
            ->where('recentContacts.0.subject', 'Hello dashboard')
            ->where('stats.contacts_new', 1)
        );
});

test('dashboard analytics returns thirty days with seeded daily counts', function () {
    $user = dashboardUser();
    $today = now()->toDateString();
    $fiveDaysAgo = now()->subDays(5)->toDateString();

    Property::factory()->create(['created_at' => now()->subDays(5)]);
    Property::factory()->create(['created_at' => now()]);
    ContactMessage::factory()->count(2)->create(['created_at' => now()]);
    NewsletterSubscriber::factory()->create(['created_at' => now()->subDays(5)]);
    Referral::factory()->create(['created_at' => now()]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('analytics.series', 30)
            ->where('analytics.seriesKeys', ['properties', 'contacts', 'subscribers', 'referrals'])
            ->where('analytics.series.0.date', now()->subDays(29)->toDateString())
            ->where('analytics.series.24.date', $fiveDaysAgo)
            ->where('analytics.series.24.properties', 1)
            ->where('analytics.series.24.subscribers', 1)
            ->where('analytics.series.29.date', $today)
            ->where('analytics.series.29.properties', 1)
            ->where('analytics.series.29.contacts', 2)
            ->where('analytics.series.29.referrals', 1)
        );
});
