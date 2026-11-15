<?php

use App\Enums\PropertyStatus;
use App\Models\ConstructionTask;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyFeature;
use App\Models\PropertyImage;
use App\Models\PropertyType;
use Illuminate\Support\Facades\Storage;

test('public can list only published properties with api response meta', function () {
    Property::factory()->published()->create([
        'title' => 'Live Property',
        'slug' => 'live-property',
    ]);
    Property::factory()->create([
        'title' => 'Draft Property',
        'slug' => 'draft-property',
    ]);

    $this->getJson(route('api.properties.index'))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 200)
        ->assertJsonPath('message', 'Properties retrieved.')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Live Property')
        ->assertJsonPath('data.0.slug', 'live-property')
        ->assertJsonStructure([
            'success',
            'status',
            'message',
            'data' => [
                [
                    'id',
                    'title',
                    'slug',
                    'location' => [
                        'id',
                        'name',
                        'address',
                        'city',
                        'area',
                        'latitude',
                        'longitude',
                        'map_url',
                        'image_url',
                    ],
                    'property_type' => ['id', 'name', 'slug'],
                    'cover_image',
                ],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page', 'from', 'to'],
        ]);
});

test('property list location includes address and coordinates', function () {
    $location = Location::factory()->create([
        'name' => 'Gulshan',
        'address' => 'Road 12, Gulshan-2',
        'latitude' => '23.7808870',
        'longitude' => '90.4166640',
    ]);

    Property::factory()->published()->create([
        'slug' => 'with-address',
        'location_id' => $location->id,
    ]);

    $this->getJson(route('api.properties.index'))
        ->assertOk()
        ->assertJsonPath('data.0.location.address', 'Road 12, Gulshan-2')
        ->assertJsonPath('data.0.location.latitude', '23.7808870')
        ->assertJsonPath('data.0.location.longitude', '90.4166640');
});

test('public can filter properties by type location and status', function () {
    $residential = PropertyType::factory()->create(['name' => 'Residential', 'slug' => 'residential']);
    $commercial = PropertyType::factory()->create(['name' => 'Commercial', 'slug' => 'commercial']);
    $gulshan = Location::factory()->create(['name' => 'Gulshan']);
    $dhanmondi = Location::factory()->create(['name' => 'Dhanmondi']);

    Property::factory()->published()->create([
        'slug' => 'match-all',
        'property_type_id' => $residential->id,
        'location_id' => $gulshan->id,
        'status' => PropertyStatus::Ongoing,
    ]);
    Property::factory()->published()->create([
        'slug' => 'wrong-type',
        'property_type_id' => $commercial->id,
        'location_id' => $gulshan->id,
        'status' => PropertyStatus::Ongoing,
    ]);
    Property::factory()->published()->create([
        'slug' => 'wrong-location',
        'property_type_id' => $residential->id,
        'location_id' => $dhanmondi->id,
        'status' => PropertyStatus::Ongoing,
    ]);
    Property::factory()->published()->create([
        'slug' => 'wrong-status',
        'property_type_id' => $residential->id,
        'location_id' => $gulshan->id,
        'status' => PropertyStatus::Completed,
    ]);
    Property::factory()->create([
        'slug' => 'unpublished-match',
        'property_type_id' => $residential->id,
        'location_id' => $gulshan->id,
        'status' => PropertyStatus::Ongoing,
        'is_published' => false,
    ]);

    $this->getJson(route('api.properties.index', [
        'property_type_id' => $residential->id,
        'location_id' => $gulshan->id,
        'status' => 'ongoing',
    ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'match-all')
        ->assertJsonPath('meta.total', 1);
});

test('property list rejects invalid status and missing foreign keys', function () {
    $this->getJson(route('api.properties.index', ['status' => 'draft']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);

    $this->getJson(route('api.properties.index', ['status' => 'not-a-status']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);

    $this->getJson(route('api.properties.index', ['property_type_id' => 999999]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['property_type_id']);

    $this->getJson(route('api.properties.index', ['location_id' => 999999]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['location_id']);
});

test('public can list active property types', function () {
    PropertyType::factory()->create(['name' => 'Zebra Type', 'slug' => 'zebra-type', 'is_active' => true]);
    PropertyType::factory()->create(['name' => 'Alpha Type', 'slug' => 'alpha-type', 'is_active' => true]);
    PropertyType::factory()->create(['name' => 'Hidden Type', 'slug' => 'hidden-type', 'is_active' => false]);

    $response = $this->getJson(route('api.property-types.index'));

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Property types retrieved.')
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'Alpha Type')
        ->assertJsonPath('data.1.name', 'Zebra Type')
        ->assertJsonStructure([
            'data' => [
                ['id', 'name', 'slug'],
            ],
        ]);

    $names = collect($response->json('data'))->pluck('name')->all();
    expect($names)->not->toContain('Hidden Type');
});

test('public can list locations ordered by name', function () {
    Location::factory()->create([
        'name' => 'Zawarde',
        'city' => 'Dhaka',
        'area' => 'A',
        'address' => 'Zawarde Road',
        'latitude' => '23.8100000',
        'longitude' => '90.4100000',
        'map_url' => 'https://maps.google.com/?q=23.81,90.41',
    ]);
    Location::factory()->create([
        'name' => 'Banani',
        'city' => 'Dhaka',
        'area' => 'B',
        'latitude' => '23.7940000',
        'longitude' => '90.4040000',
    ]);

    $this->getJson(route('api.locations.index'))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Locations retrieved.')
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'Banani')
        ->assertJsonPath('data.1.name', 'Zawarde')
        ->assertJsonPath('data.1.address', 'Zawarde Road')
        ->assertJsonPath('data.1.latitude', '23.8100000')
        ->assertJsonPath('data.1.longitude', '90.4100000')
        ->assertJsonPath('data.1.map_url', 'https://maps.google.com/?q=23.81,90.41')
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'name',
                    'address',
                    'city',
                    'area',
                    'latitude',
                    'longitude',
                    'map_url',
                    'image_url',
                ],
            ],
        ]);
});

test('public can limit property list page size', function () {
    Property::factory()->published()->count(5)->create();

    $this->getJson(route('api.properties.index', ['limit' => 2]))
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 5);
});

test('property list rejects invalid limit', function () {
    $this->getJson(route('api.properties.index', ['limit' => 0]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['limit']);
});

test('public can fetch featured properties with limit', function () {
    Property::factory()->featured()->create(['slug' => 'featured-one']);
    Property::factory()->featured()->create(['slug' => 'featured-two']);
    Property::factory()->featured()->create(['slug' => 'featured-three']);
    Property::factory()->published()->create(['slug' => 'published-not-featured']);
    Property::factory()->create([
        'slug' => 'draft-featured',
        'is_featured' => true,
        'is_published' => false,
    ]);

    $response = $this->getJson(route('api.properties.featured', ['limit' => 2]));

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Featured properties retrieved.')
        ->assertJsonCount(2, 'data');

    $slugs = collect($response->json('data'))->pluck('slug')->all();

    expect($slugs)->not->toContain('published-not-featured')
        ->and($slugs)->not->toContain('draft-featured');
});

test('featured properties reject invalid limit', function () {
    $this->getJson(route('api.properties.featured', ['limit' => 21]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['limit']);
});

test('public can fetch published property details by slug', function () {
    Storage::fake('public');

    $property = Property::factory()->published()->create([
        'title' => 'Detail Property',
        'slug' => 'detail-property',
        'description' => 'Full description',
    ]);

    $feature = PropertyFeature::factory()->create(['name' => 'Parking']);
    $property->features()->attach($feature);

    PropertyImage::factory()->cover()->create([
        'property_id' => $property->id,
        'image_path' => 'property-cover/cover.jpg',
        'alt_text' => 'Cover',
    ]);
    PropertyImage::factory()->create([
        'property_id' => $property->id,
        'image_path' => 'property-gallery/gallery.jpg',
        'alt_text' => 'Gallery',
    ]);

    $coverUrl = Storage::disk('public')->url('property-cover/cover.jpg');

    $this->getJson(route('api.properties.show', ['slug' => $property->slug]))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Property retrieved.')
        ->assertJsonPath('data.title', 'Detail Property')
        ->assertJsonPath('data.slug', 'detail-property')
        ->assertJsonPath('data.description', 'Full description')
        ->assertJsonPath('data.cover_image.url', $coverUrl)
        ->assertJsonPath('data.cover_image.alt_text', 'Cover')
        ->assertJsonCount(1, 'data.gallery_images')
        ->assertJsonCount(1, 'data.features')
        ->assertJsonPath('data.features.0.name', 'Parking')
        ->assertJsonStructure([
            'data' => [
                'id',
                'title',
                'slug',
                'location' => [
                    'id',
                    'name',
                    'city',
                    'area',
                    'address',
                    'latitude',
                    'longitude',
                    'map_url',
                    'image_url',
                ],
                'property_type' => ['id', 'name', 'slug'],
                'features',
                'cover_image',
                'gallery_images',
                'floor_plan_images',
                'tour_images',
            ],
        ]);
});

test('draft property details return not found', function () {
    $property = Property::factory()->create(['slug' => 'hidden-draft']);

    $this->getJson(route('api.properties.show', ['slug' => $property->slug]))
        ->assertNotFound();
});

test('missing property details return not found', function () {
    $this->getJson(route('api.properties.show', ['slug' => 'missing-property']))
        ->assertNotFound();
});

test('public can fetch construction progress for published property', function () {
    $property = Property::factory()->published()->create([
        'title' => 'Build Site',
        'slug' => 'build-site',
    ]);

    ConstructionTask::factory()->completed()->create([
        'property_id' => $property->id,
        'title' => 'Site Preparation',
        'sort_order' => 1,
    ]);
    ConstructionTask::factory()->inProgress(50)->create([
        'property_id' => $property->id,
        'title' => 'Foundation',
        'sort_order' => 2,
    ]);

    $this->getJson(route('api.properties.construction', ['slug' => $property->slug]))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Construction progress retrieved.')
        ->assertJsonPath('data.property.id', $property->id)
        ->assertJsonPath('data.property.title', 'Build Site')
        ->assertJsonPath('data.property.slug', 'build-site')
        ->assertJsonPath('data.overall_progress', 75)
        ->assertJsonCount(2, 'data.tasks')
        ->assertJsonPath('data.tasks.0.title', 'Site Preparation')
        ->assertJsonPath('data.tasks.0.status', 'completed')
        ->assertJsonPath('data.tasks.1.title', 'Foundation')
        ->assertJsonPath('data.tasks.1.progress_percentage', 50);
});

test('construction progress for unpublished property returns not found', function () {
    $property = Property::factory()->create(['slug' => 'draft-build']);

    ConstructionTask::factory()->create([
        'property_id' => $property->id,
    ]);

    $this->getJson(route('api.properties.construction', ['slug' => $property->slug]))
        ->assertNotFound();
});

test('featured and list include cover image when present', function () {
    Storage::fake('public');

    $property = Property::factory()->featured()->create([
        'slug' => 'with-cover',
    ]);

    PropertyImage::factory()->cover()->create([
        'property_id' => $property->id,
        'image_path' => 'property-cover/featured-cover.jpg',
        'alt_text' => 'Featured cover',
    ]);

    $coverUrl = Storage::disk('public')->url('property-cover/featured-cover.jpg');

    $this->getJson(route('api.properties.featured'))
        ->assertOk()
        ->assertJsonPath('data.0.cover_image.url', $coverUrl)
        ->assertJsonPath('data.0.cover_image.alt_text', 'Featured cover');

    $this->getJson(route('api.properties.index'))
        ->assertOk()
        ->assertJsonPath('data.0.cover_image.url', $coverUrl);
});
