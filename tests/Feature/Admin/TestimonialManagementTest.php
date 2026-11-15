<?php

use App\Enums\TestimonialType;
use App\Enums\UserRole;
use App\Enums\VideoProvider;
use App\Models\Testimonial;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function testimonialAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'testimonial-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('admin can visit testimonials page', function () {
    $admin = testimonialAdminUser();

    $this->actingAs($admin)
        ->get(route('admin.website.testimonials.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('website/testimonials/index')
            ->has('types')
            ->has('videoProviders')
        );
});

test('admin can create list update and delete testimonials', function () {
    Storage::fake('public');

    $admin = testimonialAdminUser();
    $avatar = UploadedFile::fake()->image('reviewer.jpg');

    $this->actingAs($admin)
        ->post(route('admin.website.testimonials.store'), [
            'type' => TestimonialType::Text->value,
            'reviewer_name' => 'Jane Doe',
            'reviewer_position' => 'CEO',
            'reviewer_company' => 'Acme',
            'reviewer_avatar' => $avatar,
            'content' => 'Great experience.',
            'rating' => 5,
            'sort_order' => 1,
        ])
        ->assertCreated();

    $testimonial = Testimonial::query()->where('reviewer_name', 'Jane Doe')->first();

    expect($testimonial)->not->toBeNull()
        ->and($testimonial->created_by)->toBe($admin->id)
        ->and($testimonial->rating)->toBe(5)
        ->and($testimonial->reviewer_avatar)->not->toBeNull();

    Storage::disk('public')->assertExists($testimonial->reviewer_avatar);

    $this->actingAs($admin)
        ->getJson(route('admin.website.testimonials.list', [
            'search' => 'Jane',
            'type' => TestimonialType::Text->value,
            'is_active' => 1,
        ]))
        ->assertOk()
        ->assertJsonPath('data.0.reviewer_name', 'Jane Doe');

    $this->actingAs($admin)
        ->post(route('admin.website.testimonials.update', $testimonial), [
            'type' => TestimonialType::Video->value,
            'reviewer_name' => 'Jane Doe',
            'reviewer_position' => 'CEO',
            'reviewer_company' => 'Acme',
            'content' => 'Video caption',
            'video_provider' => VideoProvider::Youtube->value,
            'video_id' => 'abc123',
            'sort_order' => 2,
            'is_active' => 0,
        ])
        ->assertOk();

    expect($testimonial->fresh())
        ->type->toBe(TestimonialType::Video)
        ->is_active->toBeFalse()
        ->video_id->toBe('abc123')
        ->sort_order->toBe(2);

    $this->actingAs($admin)
        ->deleteJson(route('admin.website.testimonials.destroy', $testimonial))
        ->assertOk();

    expect(Testimonial::query()->whereKey($testimonial->id)->exists())->toBeFalse();
});

test('public api returns only active testimonials of requested type', function () {
    Testimonial::factory()->create([
        'type' => TestimonialType::Text,
        'is_active' => true,
        'reviewer_name' => 'Active Text',
        'sort_order' => 1,
    ]);

    Testimonial::factory()->inactive()->create([
        'type' => TestimonialType::Text,
        'reviewer_name' => 'Inactive Text',
    ]);

    Testimonial::factory()->video()->create([
        'is_active' => true,
        'reviewer_name' => 'Active Video',
    ]);

    $this->getJson(route('api.testimonials.index'))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 200)
        ->assertJsonPath('message', 'Testimonials retrieved.')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.reviewer_name', 'Active Text')
        ->assertJsonPath('data.0.content', fn ($value) => filled($value));

    $this->getJson(route('api.testimonials.index', ['type' => 'video']))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Testimonials retrieved.')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.reviewer_name', 'Active Video')
        ->assertJsonPath('data.0.embed_url', fn ($value) => filled($value));
});
