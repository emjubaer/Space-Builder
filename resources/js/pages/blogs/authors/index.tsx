import { Head } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/hooks/use-can';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import AuthorsTable, {
    type AuthorRow,
} from '@/pages/blogs/authors/partials/authors-table';
import CreateAuthor from '@/pages/blogs/authors/partials/create-author';

export default function BlogAuthorsIndex() {
    const can = useCan();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['blog-authors', page, perPage, debouncedSearch],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.blogs.authors.list'),
                {
                    params: {
                        page,
                        per_page: perPage,
                        search: debouncedSearch || undefined,
                    },
                },
            );

            return response.data;
        },
    });

    const authors: AuthorRow[] = useMemo(
        () => (data?.data || []) as AuthorRow[],
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
        void queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
    };

    return (
        <>
            <Head title="Blog Authors" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Authors"
                        description="Manage blog authors"
                    />
                    {can('blog_author_create') && (
                        <CreateAuthor onSuccess={refresh} />
                    )}
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search authors..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="space-y-2 rounded-md border p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <AuthorsTable authors={authors} onChanged={refresh} />
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

BlogAuthorsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Authors',
            href: '/admin/blogs/authors',
        },
    ],
};
