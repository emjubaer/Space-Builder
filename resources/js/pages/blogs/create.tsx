import { Head, Link, router } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Eye, Save, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import ImageField, {
    type ImagePreviewItem,
} from '@/components/image-field';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type Option = {
    id: number;
    name: string | null;
};

type CoverImage = {
    id: number;
    url: string;
    name: string;
};

type BlogPayload = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    html_content: string | null;
    category_id: number;
    author_id: number;
    featured_image_url: string | null;
    featured_image_name: string | null;
    cover_images?: CoverImage[];
    meta_title: string | null;
    meta_description: string | null;
    status: string;
};

type Props = {
    categories: Option[];
    authors: Option[];
    blog: BlogPayload | null;
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function BlogCreate({ categories, authors, blog }: Props) {
    const isEdit = blog !== null;
    const [title, setTitle] = useState(blog?.title || '');
    const [slug, setSlug] = useState(blog?.slug || '');
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [description, setDescription] = useState(blog?.description || '');
    const [htmlContent, setHtmlContent] = useState(blog?.html_content || '');
    const [categoryId, setCategoryId] = useState(
        blog?.category_id ? String(blog.category_id) : '',
    );
    const [authorId, setAuthorId] = useState(
        blog?.author_id ? String(blog.author_id) : '',
    );
    const [metaTitle, setMetaTitle] = useState(blog?.meta_title || '');
    const [metaDescription, setMetaDescription] = useState(
        blog?.meta_description || '',
    );
    const [featuredImage, setFeaturedImage] = useState<ImagePreviewItem | null>(
        blog?.featured_image_url
            ? {
                  url: blog.featured_image_url,
                  name: blog.featured_image_name || 'featured-image',
              }
            : null,
    );
    const [coverImages, setCoverImages] = useState<ImagePreviewItem[]>(
        (blog?.cover_images || []).map((image) => ({
            id: image.id,
            url: image.url,
            name: image.name,
        })),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!slugTouched) {
            setSlug(slugify(title));
        }
    }, [title, slugTouched]);

    const previewUrl = useMemo(() => {
        if (!blog) {
            return null;
        }

        return route('admin.blogs.preview', blog.id);
    }, [blog]);

    const mutation = useMutation({
        mutationFn: async (publish: boolean) => {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('slug', slug);
            formData.append('description', description);
            formData.append('html_content', htmlContent);
            formData.append('category_id', categoryId);
            formData.append('author_id', authorId);
            formData.append('meta_title', metaTitle);
            formData.append('meta_description', metaDescription);
            formData.append('publish', publish ? '1' : '0');

            if (featuredImage?.file) {
                formData.append('featured_image', featuredImage.file);
            } else if (isEdit && !featuredImage) {
                formData.append('remove_featured_image', '1');
            }

            coverImages.forEach((image) => {
                if (image.id) {
                    formData.append('existing_cover_ids[]', String(image.id));
                }
                if (image.file) {
                    formData.append('cover_images[]', image.file);
                }
            });

            if (isEdit) {
                formData.append('_method', 'PUT');
                return webApi.post(
                    route('admin.blogs.update', blog.id),
                    formData,
                );
            }

            return webApi.post(route('admin.blogs.store'), formData);
        },
        onSuccess: (response) => {
            toast.success(
                response.data?.message ||
                    (isEdit
                        ? 'Blog post updated successfully.'
                        : 'Blog post created successfully.'),
            );
            setErrors({});

            const nextId = response.data?.blog?.id || blog?.id;
            if (nextId) {
                router.visit(route('admin.blogs.edit', nextId));
            }
        },
        onError: (error: {
            response?: {
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }) => {
            const serverErrors = error.response?.data?.errors || {};
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([field, messages]) => {
                mapped[field] = messages[0];
            });
            setErrors(mapped);
            toast.error(
                error.response?.data?.message || 'Failed to save blog post.',
            );
        },
    });

    return (
        <>
            <Head title={isEdit ? 'Edit Blog Post' : 'Create Blog Post'} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('admin.blogs.index')}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold">
                                    {isEdit ? 'Edit Post' : 'Create Post'}
                                </h1>
                                {blog?.status && (
                                    <Badge variant="secondary">
                                        {blog.status}
                                    </Badge>
                                )}
                                <Badge variant="outline">Rich Text</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Write content, set SEO, then save as draft or
                                publish.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {previewUrl && (
                            <Button variant="outline" asChild>
                                <a href={previewUrl} target="_blank">
                                    <Eye className="size-4" />
                                    Preview
                                </a>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate(false)}
                        >
                            <Save className="size-4" />
                            Save Draft
                        </Button>
                        <Button
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate(true)}
                        >
                            <Send className="size-4" />
                            Save and Publish
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Post Content</h2>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title" required>
                                        Blog Title
                                    </Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Blog Slug</Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(event) => {
                                            setSlugTouched(true);
                                            setSlug(event.target.value);
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Preview: /blog/{slug || 'your-slug'}
                                    </p>
                                    <InputError message={errors.slug} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Short Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        maxLength={1000}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Content</Label>
                                    <RichTextEditor
                                        value={htmlContent}
                                        onChange={setHtmlContent}
                                        minHeight={560}
                                    />
                                    <InputError message={errors.html_content} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">
                                Author & Category
                            </h2>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label required>Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={String(category.id)}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label required>Author</Label>
                                    <Select
                                        value={authorId}
                                        onValueChange={setAuthorId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select author" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {authors.map((author) => (
                                                <SelectItem
                                                    key={author.id}
                                                    value={String(author.id)}
                                                >
                                                    {author.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.author_id} />
                                </div>

                                <ImageField
                                    label="Featured Image"
                                    value={featuredImage}
                                    onChange={setFeaturedImage}
                                />
                                <InputError message={errors.featured_image} />

                                <ImageField
                                    label="Cover Images"
                                    multiple
                                    value={coverImages}
                                    onChange={setCoverImages}
                                />
                                <InputError message={errors.cover_images} />
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">SEO</h2>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="meta-title">
                                        Meta Title
                                    </Label>
                                    <Input
                                        id="meta-title"
                                        value={metaTitle}
                                        onChange={(event) =>
                                            setMetaTitle(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.meta_title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="meta-description">
                                        Meta Description
                                    </Label>
                                    <Textarea
                                        id="meta-description"
                                        value={metaDescription}
                                        onChange={(event) =>
                                            setMetaDescription(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.meta_description}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

BlogCreate.layout = {
    breadcrumbs: [
        {
            title: 'Posts',
            href: '/admin/blogs',
        },
        {
            title: 'Editor',
            href: '/admin/blogs/create',
        },
    ],
};
