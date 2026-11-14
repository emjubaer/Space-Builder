<?php

namespace App\Services\Admin;

use App\Models\Location;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class LocationService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Location
    {
        return Location::create([
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'area' => $data['area'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'image' => $this->storeImage($data['image'] ?? null),
            'map_url' => $data['map_url'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Location $location, array $data): Location
    {
        $image = $location->image;

        if (($data['image'] ?? null) instanceof UploadedFile) {
            $this->deleteImage($location->image);
            $image = $this->storeImage($data['image']);
        } elseif (
            array_key_exists('remove_image', $data)
            && filter_var($data['remove_image'], FILTER_VALIDATE_BOOLEAN)
        ) {
            $this->deleteImage($location->image);
            $image = null;
        }

        $location->update([
            'name' => $data['name'],
            'address' => array_key_exists('address', $data) ? $data['address'] : $location->address,
            'city' => array_key_exists('city', $data) ? $data['city'] : $location->city,
            'area' => array_key_exists('area', $data) ? $data['area'] : $location->area,
            'latitude' => array_key_exists('latitude', $data) ? $data['latitude'] : $location->latitude,
            'longitude' => array_key_exists('longitude', $data) ? $data['longitude'] : $location->longitude,
            'image' => $image,
            'map_url' => array_key_exists('map_url', $data) ? $data['map_url'] : $location->map_url,
        ]);

        return $location->refresh();
    }

    public function delete(Location $location): void
    {
        if ($location->hasProperties()) {
            throw ValidationException::withMessages([
                'location' => __('Location has properties and cannot be deleted.'),
            ]);
        }

        $this->deleteImage($location->image);
        $location->delete();
    }

    private function storeImage(mixed $image): ?string
    {
        if (! $image instanceof UploadedFile) {
            return null;
        }

        return $image->store('locations', 'public');
    }

    private function deleteImage(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
