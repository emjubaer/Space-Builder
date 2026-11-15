import { Head, Link } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/hooks/use-can';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import BlogsTable, { type BlogRow } from '@/pages/blogs/partials/blogs-table';

type Option = {
    id: number;
    name: string | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    categories: Option[];
    authors: Option[];
    statuses: StatusOption[];
};

export default function BlogsIndex({
    categories,
    authors,
    statuses,
}: Props) {
    const can = useCan();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [categoryId, setCategoryId] = useState('all');
    const [authorId, setAuthorId] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [status, categoryId, authorId]);

    const { data, isLoading } = useQuery({
        queryKey: [
            'blogs',
            page,
            perPage,
            debouncedSearch,
            status,
            categoryId,
            authorId,
        ],
        queryFn: async () => {
            const response = await webApi.get(route('admin.blogs.list'), {
                params: {
                    page,
                    per_page: perPage,
                    search: debouncedSearch || undefined,
                    status: status === 'all' ? undefined : status,
                    category_id:
                        categoryId === 'all' ? undefined : categoryId,
                    author_id: authorId === 'all' ? undefined : authorId,
                },
            });

            return response.data;
        },
    });

    const blogs: BlogRow[] = useMemo(
        () => (data?.data || []) as BlogRow[],
        [data],
    );

    const meta = data?.meta ?? {
        from: 0,
        to: 0,
        total: 0,
        current_page: page,
        last_page: 1,
    };

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ['blogs'] });
    };

    return (
        <>
            <Head title="Blog Posts" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Posts"
                        description="Manage blog posts"
                    />
                    {can('blog_create') && (
                        <Button asChild>
                            <Link href={route('admin.blogs.create')}>
                                <Plus className="size-4" />
                                Create Post
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search title or slug..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full lg:w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="w-full lg:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={authorId} onValueChange={setAuthorId}>
                        <SelectTrigger className="w-full lg:w-[180px]">
                            <SelectValue placeholder="Author" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All authors</SelectItem>
                            {authors.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="space-y-2 rounded-md border p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <BlogsTable blogs={blogs} onChanged={refresh} />
                )}

                <div className="mt-auto py-3">
                    <Pagination
                        meta={meta}
                        rowsPerPage={perPage}
                        setRowsPerPage={setPerPage}
                        currentPage={page}
                        setCurrentPage={setPage}
                    />
                </div>
            </div>
        </>
    );
}

BlogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Posts',
            href: '/admin/blogs',
        },
    ],
};
