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
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->default('text')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->string('reviewer_name');
            $table->string('reviewer_position')->nullable();
            $table->string('reviewer_company')->nullable();
            $table->string('reviewer_avatar')->nullable();
            $table->text('content')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->string('video_provider')->nullable();
            $table->string('video_id')->nullable();
            $table->string('video_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
