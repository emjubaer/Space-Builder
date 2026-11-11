<?php

use App\Models\ContactMessage;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
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
    $user = User::factory()->create();
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
