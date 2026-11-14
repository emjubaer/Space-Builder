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
import CreateTestimonial from '@/pages/website/testimonials/partials/create-testimonial';
import TestimonialsTable, {
    type TestimonialRow,
} from '@/pages/website/testimonials/partials/testimonials-table';

type Option = {
    value: string;
    label: string;
};

type Props = {
    types: Option[];
    videoProviders: Option[];
};

export default function TestimonialsIndex({ types, videoProviders }: Props) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [type, setType] = useState('all');
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
            'website-testimonials',
            page,
            perPage,
            debouncedSearch,
            type,
            isActive,
        ],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.website.testimonials.list'),
                {
                    params: {
                        page,
                        per_page: perPage,
                        search: debouncedSearch || undefined,
                        type: type === 'all' ? undefined : type,
                        is_active: isActive === 'all' ? undefined : isActive,
                    },
                },
            );

            return response.data;
        },
    });

    const testimonials: TestimonialRow[] = useMemo(
        () => (data?.data || []) as TestimonialRow[],
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
        void queryClient.invalidateQueries({
            queryKey: ['website-testimonials'],
        });
    };

    return (
        <>
            <Head title="Testimonials" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Testimonials"
                        description="Manage customer reviews and video testimonials."
                    />
                    <CreateTestimonial
                        types={types}
                        videoProviders={videoProviders}
                        onSuccess={refresh}
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search reviewer or company..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select
                        value={type}
                        onValueChange={(value) => {
                            setType(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={isActive}
                        onValueChange={(value) => {
                            setIsActive(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="1">Active</SelectItem>
                            <SelectItem value="0">Inactive</SelectItem>
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
                    <TestimonialsTable
                        testimonials={testimonials}
                        types={types}
                        videoProviders={videoProviders}
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

TestimonialsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Testimonials',
            href: '/admin/website/testimonials',
        },
    ],
};
