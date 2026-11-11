<?php

use App\Enums\PropertyStatus;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;

test('a property belongs to a location and property type', function () {
    $location = Location::query()->create([
        'name' => 'Gulshan',
        'city' => 'Dhaka',
        'area' => 'Gulshan 2',
    ]);

    $propertyType = PropertyType::query()->create([
        'name' => 'Apartment',
        'slug' => 'apartment',
        'is_active' => true,
    ]);

    $property = Property::query()->create([
        'location_id' => $location->id,
        'property_type_id' => $propertyType->id,
        'title' => 'Sky Residence',
        'slug' => 'sky-residence',
        'status' => PropertyStatus::Upcoming,
        'is_featured' => true,
        'is_published' => true,
    ]);

    expect($property->location->is($location))->toBeTrue()
        ->and($property->propertyType->is($propertyType))->toBeTrue()
        ->and($location->properties)->toHaveCount(1)
        ->and($property->status)->toBe(PropertyStatus::Upcoming);
});
