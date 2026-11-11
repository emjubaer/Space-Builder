<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->longText('html_content')->nullable()->after('description');
            $table->string('featured_image')->nullable()->after('html_content');
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'sqlite') {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropForeign(['author_id']);
            });
        }

        $userAuthorIds = DB::table('blogs')->distinct()->pluck('author_id')->filter();

        foreach ($userAuthorIds as $userId) {
            $user = DB::table('users')->where('id', $userId)->first();

            if ($user === null) {
                continue;
            }

            $existingAuthorId = DB::table('blog_authors')->where('user_id', $userId)->value('id');

            if ($existingAuthorId === null) {
                $baseSlug = Str::slug($user->name ?: 'author-'.$userId) ?: 'author-'.$userId;
                $slug = $baseSlug;
                $suffix = 1;

                while (DB::table('blog_authors')->where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$suffix;
                    $suffix++;
                }

                $existingAuthorId = DB::table('blog_authors')->insertGetId([
                    'user_id' => $userId,
                    'slug' => $slug,
                    'status' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('blogs')->where('author_id', $userId)->update([
                'author_id' => $existingAuthorId,
            ]);
        }

        Schema::table('blogs', function (Blueprint $table) {
            $table->foreign('author_id')->references('id')->on('blog_authors')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
        });

        $authorRows = DB::table('blog_authors')->get(['id', 'user_id']);

        foreach ($authorRows as $author) {
            DB::table('blogs')->where('author_id', $author->id)->update([
                'author_id' => $author->user_id,
            ]);
        }

        Schema::table('blogs', function (Blueprint $table) {
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
            $table->dropColumn(['html_content', 'featured_image']);
        });
    }
};
