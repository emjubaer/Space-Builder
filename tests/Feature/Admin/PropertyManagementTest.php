<?php

use App\Enums\PropertyImageType;
use App\Enums\PropertyStatus;
use App\Enums\UserRole;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyFeature;
use App\Models\PropertyImage;
use App\Models\PropertyType;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function propertyAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'property-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('property features table has no property_id column', function () {
    expect(Schema::hasColumn('property_features', 'property_id'))->toBeFalse()
        ->and(Schema::hasColumn('property_features', 'sort_order'))->toBeTrue();
});

test('guests cannot visit property pages', function () {
    $this->get(route('admin.properties.index'))->assertRedirect(route('login'));
    $this->get(route('admin.properties.features.index'))->assertRedirect(route('login'));
    $this->get(route('admin.properties.types.index'))->assertRedirect(route('login'));
    $this->get(route('admin.properties.locations.index'))->assertRedirect(route('login'));
});

test('admin can view property management pages', function () {
    $admin = propertyAdminUser();

    $this->actingAs($admin)->get(route('admin.properties.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.properties.create'))->assertOk();
    $this->actingAs($admin)->get(route('admin.properties.features.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.properties.types.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.properties.locations.index'))->assertOk();
});

test('admin can create feature type and location catalogs', function () {
    $admin = propertyAdminUser();

    $this->actingAs($admin)
        ->postJson(route('admin.properties.features.store'), [
            'name' => 'Swimming Pool',
            'slug' => 'swimming-pool',
        ])
        ->assertCreated();

    $this->actingAs($admin)
        ->postJson(route('admin.properties.types.store'), [
            'name' => 'Apartment',
        ])
        ->assertCreated();

    $this->actingAs($admin)
        ->postJson(route('admin.properties.locations.store'), [
            'name' => 'Gulshan',
            'city' => 'Dhaka',
            'latitude' => 23.7925,
            'longitude' => 90.4078,
        ])
        ->assertCreated();

    expect(PropertyFeature::query()->where('slug', 'swimming-pool')->exists())->toBeTrue()
        ->and(PropertyType::query()->where('name', 'Apartment')->exists())->toBeTrue()
        ->and(Location::query()->where('name', 'Gulshan')->exists())->toBeTrue();
});

test('admin cannot delete feature assigned to a property', function () {
    $admin = propertyAdminUser();
    $feature = PropertyFeature::factory()->create();
    $property = Property::factory()->create();
    $property->features()->attach($feature->id);

    $this->actingAs($admin)
        ->deleteJson(route('admin.properties.features.destroy', $feature))
        ->assertUnprocessable();

    expect(PropertyFeature::query()->whereKey($feature->id)->exists())->toBeTrue();
});

test('admin can create property with features and typed images', function () {
    Storage::fake('public');

    $admin = propertyAdminUser();
    $location = Location::factory()->create();
    $type = PropertyType::factory()->create();
    $featureA = PropertyFeature::factory()->create(['name' => 'Gym']);
    $featureB = PropertyFeature::factory()->create(['name' => 'Parking']);

    $response = $this->actingAs($admin)
        ->post(route('admin.properties.store'), [
            'title' => 'Skyline Residences',
            'slug' => 'skyline-residences',
            'short_description' => 'Modern apartments',
            'description' => 'Full description',
            'location_id' => $location->id,
            'property_type_id' => $type->id,
            'status' => PropertyStatus::Upcoming->value,
            'is_featured' => '1',
            'is_published' => '1',
            'feature_ids' => [$featureA->id, $featureB->id],
            'cover_image' => UploadedFile::fake()->image('cover.jpg'),
            'gallery_images' => [
                UploadedFile::fake()->image('gallery-a.jpg'),
                UploadedFile::fake()->image('gallery-b.jpg'),
            ],
            'floor_plan_images' => [
                UploadedFile::fake()->image('floor.jpg'),
            ],
            'tour_images' => [
                UploadedFile::fake()->image('tour.jpg'),
            ],
        ]);

    $response->assertCreated();

    $property = Property::query()->where('slug', 'skyline-residences')->first();

    expect($property)->not->toBeNull()
        ->and($property->is_featured)->toBeTrue()
        ->and($property->is_published)->toBeTrue()
        ->and($property->features()->count())->toBe(2)
        ->and(PropertyImage::query()->where('property_id', $property->id)->where('image_type', PropertyImageType::Cover)->count())->toBe(1)
        ->and(PropertyImage::query()->where('property_id', $property->id)->where('image_type', PropertyImageType::Gallery)->count())->toBe(2)
        ->and(PropertyImage::query()->where('property_id', $property->id)->where('image_type', PropertyImageType::FloorPlan)->count())->toBe(1)
        ->and(PropertyImage::query()->where('property_id', $property->id)->where('image_type', PropertyImageType::Tour)->count())->toBe(1);
});

test('admin can list and filter properties', function () {
    $admin = propertyAdminUser();
    $type = PropertyType::factory()->create();

    Property::factory()->create([
        'title' => 'Featured Tower',
        'slug' => 'featured-tower',
        'property_type_id' => $type->id,
        'is_featured' => true,
        'status' => PropertyStatus::Ongoing,
    ]);
    Property::factory()->create([
        'title' => 'Draft Villa',
        'slug' => 'draft-villa',
        'is_featured' => false,
        'status' => PropertyStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->getJson(route('admin.properties.list', [
            'search' => 'Featured',
            'is_featured' => 1,
            'property_type_id' => $type->id,
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'featured-tower');
});

test('admin can delete property and clean images', function () {
    Storage::fake('public');

    $admin = propertyAdminUser();
    $property = Property::factory()->create();
    $path = UploadedFile::fake()->image('cover.jpg')->store('property-cover', 'public');

    PropertyImage::factory()->cover()->create([
        'property_id' => $property->id,
        'image_path' => $path,
    ]);

    $this->actingAs($admin)
        ->deleteJson(route('admin.properties.destroy', $property))
        ->assertOk();

    expect(Property::query()->whereKey($property->id)->exists())->toBeFalse()
        ->and(PropertyImage::query()->where('property_id', $property->id)->exists())->toBeFalse();

    Storage::disk('public')->assertMissing($path);
});
