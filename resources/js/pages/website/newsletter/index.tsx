import { Head } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import SubscribersTable, {
    type SubscriberRow,
} from '@/pages/website/newsletter/partials/subscribers-table';

export default function NewsletterIndex() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isActive, setIsActive] = useState('all');
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
        queryKey: [
            'website-newsletter',
            page,
            perPage,
            debouncedSearch,
            isActive,
        ],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.website.newsletter.list'),
                {
                    params: {
                        page,
                        per_page: perPage,
                        search: debouncedSearch || undefined,
                        is_active: isActive === 'all' ? undefined : isActive,
                    },
                },
            );

            return response.data;
        },
    });

    const subscribers: SubscriberRow[] = useMemo(
        () => (data?.data || []) as SubscriberRow[],
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
        void queryClient.invalidateQueries({ queryKey: ['website-newsletter'] });
    };

    return (
        <>
            <Head title="Newsletter" />

            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Newsletter subscribers"
                    description="View and manage emails subscribed through the public newsletter form."
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search by email..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select
                        value={isActive}
                        onValueChange={(value) => {
                            setIsActive(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
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
                    <SubscribersTable
                        subscribers={subscribers}
                        onChanged={refresh}
                    />
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

NewsletterIndex.layout = {
    breadcrumbs: [
        {
            title: 'Newsletter',
            href: '/admin/website/newsletter',
        },
    ],
};
