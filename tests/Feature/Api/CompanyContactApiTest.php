<?php

use App\Enums\ContactMessageStatus;
use App\Enums\SocialPlatform;
use App\Models\CompanyOffice;
use App\Models\CompanyProfile;
use App\Models\CompanySocialLink;
use App\Models\ContactMessage;

test('public can fetch company profile with active social links offices and coordinates', function () {
    $profile = CompanyProfile::factory()->create([
        'company_name' => 'Space Builder Public',
        'email' => 'public@space.test',
        'website_url' => 'https://spacebuilder.test',
        'copyright_text' => '© 2026 Space Builder',
        'latitude' => 23.8103,
        'longitude' => 90.4125,
    ]);

    CompanySocialLink::factory()->create([
        'company_profile_id' => $profile->id,
        'platform' => SocialPlatform::Facebook,
        'url' => 'https://facebook.com/spacebuilder',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    CompanySocialLink::factory()->create([
        'company_profile_id' => $profile->id,
        'platform' => SocialPlatform::Instagram,
        'url' => 'https://instagram.com/spacebuilder',
        'is_active' => false,
        'sort_order' => 0,
    ]);
    CompanyOffice::factory()->create([
        'company_profile_id' => $profile->id,
        'name' => 'Branch',
        'is_head_office' => false,
        'latitude' => 22.3569,
        'longitude' => 91.7832,
    ]);
    CompanyOffice::factory()->headOffice()->create([
        'company_profile_id' => $profile->id,
        'latitude' => 23.8103,
        'longitude' => 90.4125,
    ]);

    $this->getJson(route('api.company-profile.show'))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 200)
        ->assertJsonPath('message', 'Company profile retrieved.')
        ->assertJsonPath('data.company_name', 'Space Builder Public')
        ->assertJsonPath('data.email', 'public@space.test')
        ->assertJsonPath('data.website_url', 'https://spacebuilder.test')
        ->assertJsonPath('data.copyright_text', '© 2026 Space Builder')
        ->assertJsonPath('data.latitude', 23.8103)
        ->assertJsonPath('data.longitude', 90.4125)
        ->assertJsonCount(1, 'data.social_links')
        ->assertJsonPath('data.social_links.0.platform', 'facebook')
        ->assertJsonPath('data.offices.0.is_head_office', true)
        ->assertJsonPath('data.offices.0.latitude', 23.8103)
        ->assertJsonCount(2, 'data.offices');
});

test('public can submit a contact message', function () {
    $response = $this->postJson(route('api.contact-messages.store'), [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',
        'phone' => '01700000000',
        'subject' => 'Project inquiry',
        'message' => 'I would like details about upcoming projects.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 201)
        ->assertJsonPath('message', 'Your message has been sent successfully.')
        ->assertJsonPath('data.first_name', 'Jane')
        ->assertJsonPath('data.subject', 'Project inquiry')
        ->assertJsonPath('data.status', ContactMessageStatus::New->value);

    $this->assertDatabaseHas('contact_messages', [
        'email' => 'jane@example.com',
        'subject' => 'Project inquiry',
        'status' => ContactMessageStatus::New->value,
    ]);
});

test('contact message submission requires subject and message', function () {
    $this->postJson(route('api.contact-messages.store'), [
        'first_name' => 'Jane',
        'email' => 'jane@example.com',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['subject', 'message']);

    expect(ContactMessage::query()->count())->toBe(0);
});
