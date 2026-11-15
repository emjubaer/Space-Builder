<?php

use App\Enums\BlogStatus;
use App\Enums\UserRole;
use App\Models\Blog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogImage;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PermissionSeeder::class);
});

function blogAdminUser(): User
{
    $user = User::factory()->create([
        'email' => 'blog-admin@example.com',
    ]);
    $user->assignRole(UserRole::Admin);

    return $user;
}

test('guests cannot visit blog pages', function () {
    $this->get(route('admin.blogs.index'))->assertRedirect(route('login'));
    $this->get(route('admin.blogs.authors.index'))->assertRedirect(route('login'));
    $this->get(route('admin.blogs.categories.index'))->assertRedirect(route('login'));
});

test('non admin users cannot visit blog pages', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Staff);

    $this->actingAs($user)
        ->get(route('admin.blogs.index'))
        ->assertForbidden();
});

test('admin can view blog list create author and category pages', function () {
    $admin = blogAdminUser();

    $this->actingAs($admin)->get(route('admin.blogs.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.blogs.create'))->assertOk();
    $this->actingAs($admin)->get(route('admin.blogs.authors.index'))->assertOk();
    $this->actingAs($admin)->get(route('admin.blogs.categories.index'))->assertOk();
});

test('admin can create author from existing user', function () {
    $admin = blogAdminUser();
    $user = User::factory()->create([
        'email' => 'writer@example.com',
    ]);

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.authors.store'), [
            'user_id' => $user->id,
            'bio' => 'Writes about space.',
            'designation' => 'Editor',
        ])
        ->assertCreated();

    $author = BlogAuthor::query()->where('user_id', $user->id)->first();

    expect($author)->not->toBeNull()
        ->and($author->bio)->toBe('Writes about space.')
        ->and($user->fresh()->hasRole(UserRole::Author))->toBeTrue();
});

test('admin can create author with new user', function () {
    $admin = blogAdminUser();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.authors.store'), [
            'name' => 'New Author',
            'email' => 'new-author@example.com',
            'mobile' => '01999999999',
            'password' => 'password',
            'password_confirmation' => 'password',
            'designation' => 'Contributor',
        ])
        ->assertCreated();

    $user = User::query()->where('email', 'new-author@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->blogAuthor)->not->toBeNull()
        ->and($user->hasRole(UserRole::Author))->toBeTrue();
});

test('admin can create author with avatar for new user', function () {
    Storage::fake('public');

    $admin = blogAdminUser();
    $avatar = UploadedFile::fake()->image('avatar.jpg');

    $this->actingAs($admin)
        ->post(route('admin.blogs.authors.store'), [
            'name' => 'Avatar Author',
            'email' => 'avatar-author@example.com',
            'mobile' => '01888888888',
            'password' => 'password',
            'password_confirmation' => 'password',
            'avatar' => $avatar,
        ])
        ->assertCreated();

    $user = User::query()->where('email', 'avatar-author@example.com')->first();

    expect($user?->avatar)->not->toBeNull();
    Storage::disk('public')->assertExists($user->avatar);
});

test('admin can update author without changing slug', function () {
    $admin = blogAdminUser();
    $author = BlogAuthor::factory()->create([
        'slug' => 'keep-this-slug',
        'designation' => 'Old',
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.blogs.authors.update', $author), [
            'bio' => 'Updated bio',
            'designation' => 'Senior Editor',
            'status' => true,
        ])
        ->assertOk();

    expect($author->fresh()->slug)->toBe('keep-this-slug')
        ->and($author->fresh()->designation)->toBe('Senior Editor')
        ->and($author->fresh()->bio)->toBe('Updated bio');
});

test('admin can update author avatar', function () {
    Storage::fake('public');

    $admin = blogAdminUser();
    $author = BlogAuthor::factory()->create();
    $oldAvatar = UploadedFile::fake()->image('old-avatar.jpg')->store('avatars', 'public');
    $author->user->update(['avatar' => $oldAvatar]);

    $newAvatar = UploadedFile::fake()->image('new-avatar.jpg');

    $this->actingAs($admin)
        ->post(route('admin.blogs.authors.update', $author), [
            '_method' => 'PUT',
            'bio' => $author->bio,
            'designation' => $author->designation,
            'status' => true,
            'avatar' => $newAvatar,
        ])
        ->assertOk();

    $author->refresh()->load('user');

    expect($author->user?->avatar)->not->toBeNull()
        ->and($author->user?->avatar)->not->toBe($oldAvatar);

    Storage::disk('public')->assertMissing($oldAvatar);
    Storage::disk('public')->assertExists($author->user->avatar);
});

test('admin can create update and delete category', function () {
    $admin = blogAdminUser();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.categories.store'), [
            'name' => 'Space News',
            'description' => 'Latest updates',
            'is_active' => true,
        ])
        ->assertCreated();

    $category = BlogCategory::query()->where('name', 'Space News')->first();

    expect($category)->not->toBeNull()
        ->and($category->slug)->not->toBeEmpty();

    $this->actingAs($admin)
        ->putJson(route('admin.blogs.categories.update', $category), [
            'name' => 'Orbit News',
            'slug' => 'orbit-news',
            'description' => 'Updated',
            'is_active' => false,
        ])
        ->assertOk();

    expect($category->fresh()->name)->toBe('Orbit News')
        ->and($category->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->deleteJson(route('admin.blogs.categories.destroy', $category))
        ->assertOk();

    expect(BlogCategory::query()->find($category->id))->toBeNull();
});

test('admin can create draft and published blog posts', function () {
    $admin = blogAdminUser();
    $category = BlogCategory::factory()->create();
    $author = BlogAuthor::factory()->create();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.store'), [
            'title' => 'Hello Space',
            'description' => 'Short description',
            'html_content' => '<p>Full content here</p>',
            'category_id' => $category->id,
            'author_id' => $author->id,
            'publish' => false,
        ])
        ->assertCreated();

    $draft = Blog::query()->where('title', 'Hello Space')->first();

    expect($draft)->not->toBeNull()
        ->and($draft->status)->toBe(BlogStatus::Draft)
        ->and($draft->description)->toBe('Short description')
        ->and($draft->html_content)->toBe('<p>Full content here</p>')
        ->and($draft->author_id)->toBe($author->id);

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.store'), [
            'title' => 'Published Space',
            'description' => 'Published short',
            'html_content' => '<p>Published body</p>',
            'category_id' => $category->id,
            'author_id' => $author->id,
            'publish' => true,
        ])
        ->assertCreated();

    $published = Blog::query()->where('title', 'Published Space')->first();

    expect($published->status)->toBe(BlogStatus::Published)
        ->and($published->published_at)->not->toBeNull();
});

test('admin can mark blog as published and draft', function () {
    $admin = blogAdminUser();
    $blog = Blog::factory()->create([
        'status' => BlogStatus::Draft,
        'published_at' => null,
    ]);

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.mark-as-published', $blog))
        ->assertOk();

    expect($blog->fresh()->status)->toBe(BlogStatus::Published)
        ->and($blog->fresh()->published_at)->not->toBeNull();

    $this->actingAs($admin)
        ->postJson(route('admin.blogs.mark-as-draft', $blog))
        ->assertOk();

    expect($blog->fresh()->status)->toBe(BlogStatus::Draft);
});

test('admin can filter blog list by status category and author', function () {
    $admin = blogAdminUser();
    $categoryA = BlogCategory::factory()->create(['name' => 'Alpha']);
    $categoryB = BlogCategory::factory()->create(['name' => 'Beta']);
    $authorA = BlogAuthor::factory()->create();
    $authorB = BlogAuthor::factory()->create();

    Blog::factory()->create([
        'title' => 'Alpha Draft',
        'category_id' => $categoryA->id,
        'author_id' => $authorA->id,
        'status' => BlogStatus::Draft,
    ]);

    Blog::factory()->published()->create([
        'title' => 'Beta Published',
        'category_id' => $categoryB->id,
        'author_id' => $authorB->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('admin.blogs.list', [
            'status' => 'published',
            'category_id' => $categoryB->id,
            'author_id' => $authorB->id,
            'search' => 'Beta',
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Beta Published');
});

test('admin can preview blog posts', function () {
    $admin = blogAdminUser();
    $blog = Blog::factory()->create([
        'title' => 'Preview Me',
        'html_content' => '<p>Preview body</p>',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.blogs.preview', $blog))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('blogs/preview')
            ->where('blog.title', 'Preview Me'));
});

test('category with posts cannot be deleted', function () {
    $admin = blogAdminUser();
    $category = BlogCategory::factory()->create();
    Blog::factory()->create(['category_id' => $category->id]);

    $this->actingAs($admin)
        ->deleteJson(route('admin.blogs.categories.destroy', $category))
        ->assertStatus(422);

    expect(BlogCategory::query()->find($category->id))->not->toBeNull();
});

test('author with posts cannot be deleted', function () {
    $admin = blogAdminUser();
    $author = BlogAuthor::factory()->create();
    Blog::factory()->create(['author_id' => $author->id]);

    $this->actingAs($admin)
        ->deleteJson(route('admin.blogs.authors.destroy', $author))
        ->assertStatus(422);

    expect(BlogAuthor::query()->find($author->id))->not->toBeNull();
});

test('admin can create blog post with cover images', function () {
    Storage::fake('public');

    $admin = blogAdminUser();
    $category = BlogCategory::factory()->create();
    $author = BlogAuthor::factory()->create();
    $coverA = UploadedFile::fake()->image('cover-a.jpg');
    $coverB = UploadedFile::fake()->image('cover-b.jpg');

    $this->actingAs($admin)
        ->post(route('admin.blogs.store'), [
            'title' => 'Cover Gallery',
            'description' => 'With covers',
            'html_content' => '<p>Body</p>',
            'category_id' => $category->id,
            'author_id' => $author->id,
            'publish' => false,
            'cover_images' => [$coverA, $coverB],
        ])
        ->assertCreated();

    $blog = Blog::query()->where('title', 'Cover Gallery')->first();

    expect($blog)->not->toBeNull()
        ->and(BlogImage::query()->where('blog_id', $blog->id)->where('image_type', 'cover')->count())->toBe(2);
});
