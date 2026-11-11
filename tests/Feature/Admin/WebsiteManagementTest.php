<?php

use App\Enums\ContactMessageStatus;
use App\Enums\SocialPlatform;
use App\Enums\UserRole;
use App\Models\CompanyOffice;
use App\Models\CompanyProfile;
use App\Models\CompanySocialLink;
use App\Models\ContactMessage;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function websiteAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'website-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit website admin pages', function () {
    $this->get(route('admin.website.general.index'))->assertRedirect(route('login'));
    $this->get(route('admin.website.contacts.index'))->assertRedirect(route('login'));
});

test('non admin users cannot visit website admin pages', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.website.general.index'))
        ->assertForbidden();
});

test('admin can view website general and contacts pages', function () {
    $admin = websiteAdminUser();

    $this->actingAs($admin)
        ->get(route('admin.website.general.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('website/general/index')
            ->has('profile')
            ->has('platforms')
        );

    $this->actingAs($admin)
        ->get(route('admin.website.contacts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('website/contacts/index')
            ->has('statuses')
        );
});

test('old company path redirects to general', function () {
    $admin = websiteAdminUser();

    $this->actingAs($admin)
        ->get('/admin/website/company')
        ->assertRedirect('/admin/website/general');
});

test('admin can update website general with branding and map coordinates', function () {
    Storage::fake('public');

    $admin = websiteAdminUser();
    $logo = UploadedFile::fake()->image('logo.png');
    $favicon = UploadedFile::fake()->image('favicon.png');

    $this->actingAs($admin)
        ->post(route('admin.website.general.update'), [
            'company_name' => 'Space Builder HQ',
            'tagline' => 'Build better',
            'description' => 'We build spaces.',
            'email' => 'hello@space.test',
            'phone' => '01700000000',
            'address' => 'Dhaka',
            'website_url' => 'https://spacebuilder.test',
            'copyright_text' => '© 2026 Space Builder',
            'latitude' => '23.8103000',
            'longitude' => '90.4125000',
            'logo' => $logo,
            'favicon' => $favicon,
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Website general settings updated successfully.');

    $profile = CompanyProfile::query()->first();

    expect($profile)->not->toBeNull()
        ->and($profile->company_name)->toBe('Space Builder HQ')
        ->and($profile->website_url)->toBe('https://spacebuilder.test')
        ->and($profile->copyright_text)->toBe('© 2026 Space Builder')
        ->and((float) $profile->latitude)->toBe(23.8103)
        ->and((float) $profile->longitude)->toBe(90.4125)
        ->and($profile->logo)->not->toBeNull()
        ->and($profile->favicon)->not->toBeNull();

    Storage::disk('public')->assertExists($profile->logo);
    Storage::disk('public')->assertExists($profile->favicon);
});

test('admin can create update and delete social links', function () {
    $admin = websiteAdminUser();
    $profile = CompanyProfile::current();

    $this->actingAs($admin)
        ->postJson(route('admin.website.general.social-links.store'), [
            'platform' => SocialPlatform::Facebook->value,
            'url' => 'https://facebook.com/spacebuilder',
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertCreated();

    $link = CompanySocialLink::query()->where('company_profile_id', $profile->id)->first();

    expect($link)->not->toBeNull()
        ->and($link->platform)->toBe(SocialPlatform::Facebook);

    $this->actingAs($admin)
        ->putJson(route('admin.website.general.social-links.update', $link), [
            'platform' => SocialPlatform::Linkedin->value,
            'url' => 'https://linkedin.com/company/spacebuilder',
            'is_active' => false,
            'sort_order' => 2,
        ])
        ->assertOk();

    expect($link->fresh()->platform)->toBe(SocialPlatform::Linkedin)
        ->and($link->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->deleteJson(route('admin.website.general.social-links.destroy', $link))
        ->assertOk();

    expect(CompanySocialLink::query()->whereKey($link->id)->exists())->toBeFalse();
});

test('admin can create update and delete offices with coordinates and single head office', function () {
    $admin = websiteAdminUser();
    $profile = CompanyProfile::current();

    $this->actingAs($admin)
        ->postJson(route('admin.website.general.offices.store'), [
            'name' => 'Head Office',
            'address' => 'Dhaka',
            'email' => 'hq@space.test',
            'phone' => '01711111111',
            'is_head_office' => true,
            'latitude' => 23.8103,
            'longitude' => 90.4125,
        ])
        ->assertCreated();

    $head = CompanyOffice::query()->where('company_profile_id', $profile->id)->first();

    expect((float) $head->latitude)->toBe(23.8103)
        ->and((float) $head->longitude)->toBe(90.4125);

    $this->actingAs($admin)
        ->postJson(route('admin.website.general.offices.store'), [
            'name' => 'Branch Office',
            'address' => 'Chittagong',
            'is_head_office' => true,
            'latitude' => 22.3569,
            'longitude' => 91.7832,
        ])
        ->assertCreated();

    expect($head->fresh()->is_head_office)->toBeFalse()
        ->and(CompanyOffice::query()->where('is_head_office', true)->count())->toBe(1);

    $branch = CompanyOffice::query()->where('name', 'Branch Office')->first();

    $this->actingAs($admin)
        ->putJson(route('admin.website.general.offices.update', $branch), [
            'name' => 'Port City Office',
            'address' => 'Chittagong',
            'is_head_office' => false,
            'latitude' => 22.4,
            'longitude' => 91.8,
        ])
        ->assertOk();

    expect($branch->fresh()->name)->toBe('Port City Office')
        ->and((float) $branch->fresh()->latitude)->toBe(22.4);

    $this->actingAs($admin)
        ->deleteJson(route('admin.website.general.offices.destroy', $branch))
        ->assertOk();

    expect(CompanyOffice::query()->whereKey($branch->id)->exists())->toBeFalse();
});

test('admin can list filter update status and delete contact messages', function () {
    $admin = websiteAdminUser();

    $newMessage = ContactMessage::factory()->create([
        'first_name' => 'Alice',
        'subject' => 'Pricing question',
        'status' => ContactMessageStatus::New,
    ]);
    ContactMessage::factory()->create([
        'first_name' => 'Bob',
        'subject' => 'Spam pitch',
        'status' => ContactMessageStatus::Spam,
    ]);

    $this->actingAs($admin)
        ->getJson(route('admin.website.contacts.list', [
            'search' => 'Alice',
            'status' => ContactMessageStatus::New->value,
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'Alice');

    $this->actingAs($admin)
        ->getJson(route('admin.website.contacts.show', $newMessage))
        ->assertOk()
        ->assertJsonPath('contact.status', ContactMessageStatus::InProgress->value);

    expect($newMessage->fresh()->status)->toBe(ContactMessageStatus::InProgress);

    $this->actingAs($admin)
        ->putJson(route('admin.website.contacts.status', $newMessage), [
            'status' => ContactMessageStatus::Resolved->value,
        ])
        ->assertOk()
        ->assertJsonPath('contact.status', ContactMessageStatus::Resolved->value);

    $this->actingAs($admin)
        ->deleteJson(route('admin.website.contacts.destroy', $newMessage))
        ->assertOk();

    expect(ContactMessage::query()->whereKey($newMessage->id)->exists())->toBeFalse();
});
