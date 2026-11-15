<?php

use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\BlogImage;
use Illuminate\Support\Facades\Storage;

test('public can list only published blogs with pagination meta', function () {
    Blog::factory()->published()->create(['title' => 'Live Post', 'slug' => 'live-post']);
    Blog::factory()->create(['title' => 'Draft Post', 'slug' => 'draft-post']);

    $this->getJson(route('api.blogs.index'))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 200)
        ->assertJsonPath('message', 'Blogs retrieved.')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Live Post')
        ->assertJsonPath('data.0.slug', 'live-post')
        ->assertJsonStructure([
            'success',
            'status',
            'message',
            'data',
            'meta' => ['current_page', 'per_page', 'total', 'last_page', 'from', 'to'],
        ]);
});

test('public can search published blogs by title', function () {
    Blog::factory()->published()->create([
        'title' => 'Modern Home Design',
        'slug' => 'modern-home-design',
    ]);
    Blog::factory()->published()->create([
        'title' => 'Office Interiors',
        'slug' => 'office-interiors',
    ]);

    $this->getJson(route('api.blogs.index', ['search' => 'home']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'modern-home-design');
});

test('public can limit blog list page size', function () {
    Blog::factory()->published()->count(5)->create();

    $this->getJson(route('api.blogs.index', ['limit' => 2]))
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.per_page', 2);
});

test('blog list rejects invalid limit', function () {
    $this->getJson(route('api.blogs.index', ['limit' => 0]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['limit']);
});

test('public can fetch published blog details by slug', function () {
    $blog = Blog::factory()->published()->create([
        'title' => 'Detail Post',
        'slug' => 'detail-post',
        'html_content' => '<p>Full content</p>',
        'meta_title' => 'Detail SEO',
    ]);

    $this->getJson(route('api.blogs.show', ['slug' => $blog->slug]))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Blog retrieved.')
        ->assertJsonPath('data.title', 'Detail Post')
        ->assertJsonPath('data.slug', 'detail-post')
        ->assertJsonPath('data.html_content', '<p>Full content</p>')
        ->assertJsonPath('data.meta_title', 'Detail SEO')
        ->assertJsonStructure([
            'success',
            'status',
            'message',
            'data' => [
                'id',
                'title',
                'slug',
                'category' => ['id', 'name', 'slug'],
                'author' => ['id', 'name', 'slug', 'avatar_url'],
                'cover_images',
                'featured_image_url',
            ],
        ])
        ->assertJsonMissingPath('data.cover_image_url');
});

test('public blog details and list return featured and cover images without duplication', function () {
    Storage::fake('public');

    $blog = Blog::factory()->published()->create([
        'title' => 'Gallery Post',
        'slug' => 'gallery-post',
        'featured_image' => 'blog-featured/featured.jpg',
    ]);

    BlogImage::create([
        'blog_id' => $blog->id,
        'blog_section_id' => null,
        'image_path' => 'blog-covers/cover-a.jpg',
        'image_type' => 'cover',
        'alt_text' => 'Cover A',
        'caption' => null,
        'sort_order' => 1,
    ]);
    BlogImage::create([
        'blog_id' => $blog->id,
        'blog_section_id' => null,
        'image_path' => 'blog-covers/cover-b.jpg',
        'image_type' => 'cover',
        'alt_text' => null,
        'caption' => 'Second cover',
        'sort_order' => 2,
    ]);

    $featuredUrl = Storage::disk('public')->url('blog-featured/featured.jpg');
    $coverAUrl = Storage::disk('public')->url('blog-covers/cover-a.jpg');

    $this->getJson(route('api.blogs.show', ['slug' => $blog->slug]))
        ->assertOk()
        ->assertJsonPath('data.featured_image_url', $featuredUrl)
        ->assertJsonMissingPath('data.cover_image_url')
        ->assertJsonCount(2, 'data.cover_images')
        ->assertJsonPath('data.cover_images.0.url', $coverAUrl)
        ->assertJsonPath('data.cover_images.0.alt_text', 'Cover A')
        ->assertJsonPath('data.cover_images.1.caption', 'Second cover');

    $this->getJson(route('api.blogs.index'))
        ->assertOk()
        ->assertJsonPath('data.0.featured_image_url', $featuredUrl)
        ->assertJsonMissingPath('data.0.cover_image_url')
        ->assertJsonCount(2, 'data.0.cover_images')
        ->assertJsonPath('data.0.cover_images.0.url', $coverAUrl);
});

test('public blog without covers returns empty cover images', function () {
    $blog = Blog::factory()->published()->create([
        'slug' => 'no-covers',
        'featured_image' => null,
    ]);

    $this->getJson(route('api.blogs.show', ['slug' => $blog->slug]))
        ->assertOk()
        ->assertJsonPath('data.featured_image_url', null)
        ->assertJsonMissingPath('data.cover_image_url')
        ->assertJsonPath('data.cover_images', []);
});

test('draft blog details return not found', function () {
    $blog = Blog::factory()->create([
        'slug' => 'hidden-draft',
    ]);

    $this->getJson(route('api.blogs.show', ['slug' => $blog->slug]))
        ->assertNotFound();
});

test('public can fetch related blogs from the same category with limit', function () {
    $category = BlogCategory::factory()->create();
    $otherCategory = BlogCategory::factory()->create();

    $blog = Blog::factory()->published()->create([
        'category_id' => $category->id,
        'slug' => 'main-post',
        'published_at' => now()->subDay(),
    ]);

    Blog::factory()->published()->create([
        'category_id' => $category->id,
        'slug' => 'related-one',
        'published_at' => now()->subHours(2),
    ]);
    Blog::factory()->published()->create([
        'category_id' => $category->id,
        'slug' => 'related-two',
        'published_at' => now()->subHours(1),
    ]);
    Blog::factory()->published()->create([
        'category_id' => $category->id,
        'slug' => 'related-three',
        'published_at' => now(),
    ]);
    Blog::factory()->published()->create([
        'category_id' => $otherCategory->id,
        'slug' => 'other-category',
    ]);
    Blog::factory()->create([
        'category_id' => $category->id,
        'slug' => 'draft-related',
    ]);

    $response = $this->getJson(route('api.blogs.related', [
        'slug' => $blog->slug,
        'limit' => 2,
    ]));

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Related blogs retrieved.')
        ->assertJsonCount(2, 'data');

    $slugs = collect($response->json('data'))->pluck('slug')->all();

    expect($slugs)->not->toContain('main-post')
        ->and($slugs)->not->toContain('other-category')
        ->and($slugs)->not->toContain('draft-related')
        ->and($slugs)->toContain('related-three')
        ->and($slugs)->toContain('related-two');
});

test('related blogs for missing slug return not found', function () {
    $this->getJson(route('api.blogs.related', ['slug' => 'missing-post']))
        ->assertNotFound();
});
