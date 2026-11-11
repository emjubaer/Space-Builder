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
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->string('website_url')->nullable()->after('address');
            $table->string('favicon')->nullable()->after('logo');
            $table->string('copyright_text')->nullable()->after('website_url');
            $table->decimal('latitude', 10, 7)->nullable()->after('copyright_text');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        Schema::table('company_offices', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('is_head_office');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'website_url',
                'favicon',
                'copyright_text',
                'latitude',
                'longitude',
            ]);
        });

        Schema::table('company_offices', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
