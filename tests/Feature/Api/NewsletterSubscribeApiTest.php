<?php

use App\Models\NewsletterSubscriber;

test('public can subscribe to the newsletter with an email', function () {
    $response = $this->postJson(route('api.newsletter.subscribe'), [
        'email' => 'jane@example.com',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 201)
        ->assertJsonPath('data.email', 'jane@example.com')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('newsletter_subscribers', [
        'email' => 'jane@example.com',
        'is_active' => true,
    ]);
});

test('newsletter subscribe normalizes email to lowercase', function () {
    $this->postJson(route('api.newsletter.subscribe'), [
        'email' => 'Jane.Doe@Example.COM',
    ])->assertCreated()
        ->assertJsonPath('data.email', 'jane.doe@example.com');

    $this->assertDatabaseHas('newsletter_subscribers', [
        'email' => 'jane.doe@example.com',
    ]);
});

test('newsletter subscribe is idempotent for an already active email', function () {
    NewsletterSubscriber::factory()->create([
        'email' => 'existing@example.com',
        'is_active' => true,
    ]);

    $this->postJson(route('api.newsletter.subscribe'), [
        'email' => 'existing@example.com',
    ])->assertCreated()
        ->assertJsonPath('data.email', 'existing@example.com')
        ->assertJsonPath('data.is_active', true);

    expect(NewsletterSubscriber::query()->where('email', 'existing@example.com')->count())->toBe(1);
});

test('newsletter subscribe reactivates an inactive subscriber', function () {
    NewsletterSubscriber::factory()->inactive()->create([
        'email' => 'returning@example.com',
    ]);

    $this->postJson(route('api.newsletter.subscribe'), [
        'email' => 'returning@example.com',
    ])->assertCreated()
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('newsletter_subscribers', [
        'email' => 'returning@example.com',
        'is_active' => true,
    ]);
});

test('newsletter subscribe requires a valid email', function () {
    $this->postJson(route('api.newsletter.subscribe'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    $this->postJson(route('api.newsletter.subscribe'), [
        'email' => 'not-an-email',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});
