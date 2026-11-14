<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('property_features', 'property_id')) {
            Schema::table('property_features', function (Blueprint $table) {
                $table->dropConstrainedForeignId('property_id');
            });
        }

        if (! Schema::hasColumn('property_features', 'sort_order')) {
            Schema::table('property_features', function (Blueprint $table) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_active');
            });
        }

        Schema::table('property_images', function (Blueprint $table) {
            $table->string('image_type')->default('gallery')->nullable(false)->change();
        });

        $hasImageTypeIndex = collect(Schema::getIndexes('property_images'))
            ->contains(fn (array $index) => in_array('image_type', $index['columns'], true));

        if (! $hasImageTypeIndex) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->index('image_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $hasImageTypeIndex = collect(Schema::getIndexes('property_images'))
            ->contains(fn (array $index) => in_array('image_type', $index['columns'], true)
                && count($index['columns']) === 1);

        if ($hasImageTypeIndex) {
            Schema::table('property_images', function (Blueprint $table) {
                $table->dropIndex(['image_type']);
            });
        }

        Schema::table('property_images', function (Blueprint $table) {
            $table->string('image_type')->nullable()->default(null)->change();
        });

        if (Schema::hasColumn('property_features', 'sort_order')) {
            Schema::table('property_features', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
