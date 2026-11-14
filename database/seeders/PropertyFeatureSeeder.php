<?php

namespace Database\Seeders;

use App\Models\PropertyFeature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PropertyFeatureSeeder extends Seeder
{
    /**
     * Seed common property features.
     */
    public function run(): void
    {
        $features = [
            // Building & Security
            '24/7 Security',
            'CCTV Surveillance',
            'Fire Safety System',
            'Intercom System',
            'Emergency Exit',
            'Generator Backup',
            'Earthquake Resistant Structure',

            // Facilities
            'Swimming Pool',
            'Gymnasium',
            'Rooftop Garden',
            'Community Hall',
            "Children's Play Area",
            'Prayer Room',
            'Indoor Games Room',
            'Walking Track',

            // Parking & Transport
            'Dedicated Parking',
            'Visitor Parking',
            'EV Charging Station',

            // Building Amenities
            'High-Speed Elevator',
            'Backup Lift',
            'Reception & Lobby',
            'Central AC',
            'Waste Management System',
            'Water Treatment Plant',

            // Apartment Features
            'Balcony',
            'Modern Kitchen',
            'Attached Bathroom',
            'Built-in Wardrobe',
            'Natural Ventilation',
            'Smart Home System',

            // Outdoor & Environment
            'Landscaped Garden',
            'Rooftop Terrace',
            'Rainwater Harvesting',
            'Solar Power System',
            'Lake View',
            'Green Space',
        ];

        foreach ($features as $index => $name) {
            $sortOrder = $index + 1;
            $slug = Str::slug($name) ?: 'feature-'.$sortOrder;

            PropertyFeature::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'icon' => null,
                    'is_active' => true,
                    'sort_order' => $sortOrder,
                ],
            );
        }
    }
}
