import { Head } from '@inertiajs/react';

type BlogPreview = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    html_content: string | null;
    featured_image_url: string | null;
    cover_images?: { id: number; url: string; name: string }[];
    status: string;
    published_at: string | null;
    reading_time: number | null;
    category?: { id: number; name: string; slug: string } | null;
    author?: {
        id: number;
        designation?: string | null;
        user?: { id: number; name: string | null; email: string } | null;
    } | null;
};

type Props = {
    blog: BlogPreview;
};

export default function BlogPreview({ blog }: Props) {
    return (
        <>
            <Head title={`Preview: ${blog.title}`} />

            <div className="min-h-screen bg-white text-zinc-900">
                {(blog.cover_images?.[0]?.url || blog.featured_image_url) && (
                    <div className="mx-auto max-w-4xl px-4 pt-8">
                        <img
                            src={
                                blog.cover_images?.[0]?.url ||
                                blog.featured_image_url ||
                                ''
                            }
                            alt=""
                            className="h-64 w-full rounded-xl object-cover md:h-80"
                        />
                    </div>
                )}

                <article className="mx-auto max-w-3xl px-4 py-10">
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                        {blog.category?.name && (
                            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
                                {blog.category.name}
                            </span>
                        )}
                        <span className="uppercase tracking-wide">
                            {blog.status}
                        </span>
                        {blog.reading_time ? (
                            <span>{blog.reading_time} min read</span>
                        ) : null}
                    </div>

                    <h1 className="mb-4 text-4xl font-semibold tracking-tight">
                        {blog.title}
                    </h1>

                    {blog.description && (
                        <p className="mb-6 text-lg text-zinc-600">
                            {blog.description}
                        </p>
                    )}

                    <div className="mb-8 flex items-center gap-3 border-b border-zinc-200 pb-6 text-sm text-zinc-600">
                        <div>
                            <div className="font-medium text-zinc-900">
                                {blog.author?.user?.name || 'Unknown author'}
                            </div>
                            {blog.author?.designation && (
                                <div>{blog.author.designation}</div>
                            )}
                        </div>
                    </div>

                    <div
                        className="prose prose-zinc max-w-none"
                        dangerouslySetInnerHTML={{
                            __html: blog.html_content || '',
                        }}
                    />
                </article>
            </div>
        </>
    );
}

BlogPreview.layout = {
    breadcrumbs: [],
};
