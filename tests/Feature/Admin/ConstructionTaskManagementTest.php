<?php

use App\Enums\ConstructionTaskStatus;
use App\Enums\PropertyStatus;
use App\Enums\UserRole;
use App\Models\ConstructionTask;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function constructionAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'construction-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

function constructionProperty(): Property
{
    return Property::factory()->create([
        'location_id' => Location::factory(),
        'property_type_id' => PropertyType::factory(),
        'status' => PropertyStatus::Ongoing,
        'is_published' => true,
    ]);
}

test('admin can manage construction tasks and update progress on a property', function () {
    $admin = constructionAdminUser();
    $property = constructionProperty();

    $this->actingAs($admin)
        ->get(route('admin.properties.edit', $property))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('properties/create')
            ->has('constructionTasks')
            ->has('constructionTaskStatuses')
        );

    $this->actingAs($admin)
        ->postJson(route('admin.properties.construction-tasks.store', $property), [
            'title' => 'Foundation Work',
            'description' => 'Piling and footing',
            'sort_order' => 1,
        ])
        ->assertCreated();

    $task = ConstructionTask::query()
        ->where('property_id', $property->id)
        ->where('title', 'Foundation Work')
        ->first();

    expect($task)->not->toBeNull()
        ->and($task->status)->toBe(ConstructionTaskStatus::Pending);

    $this->actingAs($admin)
        ->patchJson(route('admin.properties.construction-tasks.progress', [
            'property' => $property,
            'constructionTask' => $task,
        ]), [
            'progress_percentage' => 55,
        ])
        ->assertOk();

    expect($task->fresh())
        ->progress_percentage->toEqual(55.0)
        ->status->toBe(ConstructionTaskStatus::InProgress);

    $this->actingAs($admin)
        ->postJson(route('admin.properties.construction-tasks.apply-defaults', $property))
        ->assertOk();

    expect($property->constructionTasks()->count())->toBeGreaterThan(1);

    $this->actingAs($admin)
        ->deleteJson(route('admin.properties.construction-tasks.destroy', [
            'property' => $property,
            'constructionTask' => $task,
        ]))
        ->assertOk();

    expect(ConstructionTask::query()->whereKey($task->id)->exists())->toBeFalse();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk();
});
