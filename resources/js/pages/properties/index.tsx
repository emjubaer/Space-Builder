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
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import PropertiesTable, {
    type PropertyRow,
} from '@/pages/properties/partials/properties-table';

type Option = {
    id: number;
    name: string | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    types: Option[];
    statuses: StatusOption[];
    constructionTaskStatuses?: StatusOption[];
};

export default function PropertiesIndex({
    types,
    statuses,
    constructionTaskStatuses = [],
}: Props) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [typeId, setTypeId] = useState('all');
    const [featured, setFeatured] = useState('all');
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
    }, [status, typeId, featured]);

    const { data, isLoading } = useQuery({
        queryKey: [
            'properties',
            page,
            perPage,
            debouncedSearch,
            status,
            typeId,
            featured,
        ],
        queryFn: async () => {
            const response = await webApi.get(route('admin.properties.list'), {
                params: {
                    page,
                    per_page: perPage,
                    search: debouncedSearch || undefined,
                    status: status === 'all' ? undefined : status,
                    property_type_id: typeId === 'all' ? undefined : typeId,
                    is_featured: featured === 'all' ? undefined : featured,
                },
            });

            return response.data;
        },
    });

    const properties: PropertyRow[] = useMemo(
        () => (data?.data || []) as PropertyRow[],
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
        void queryClient.invalidateQueries({ queryKey: ['properties'] });
    };

    return (
        <>
            <Head title="Properties" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Properties"
                        description="Manage property listings"
                    />
                    <Button asChild>
                        <Link href={route('admin.properties.create')}>
                            <Plus className="size-4" />
                            Create Property
                        </Link>
                    </Button>
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
                    <Select value={typeId} onValueChange={setTypeId}>
                        <SelectTrigger className="w-full lg:w-[180px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={featured} onValueChange={setFeatured}>
                        <SelectTrigger className="w-full lg:w-[160px]">
                            <SelectValue placeholder="Featured" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="1">Featured</SelectItem>
                            <SelectItem value="0">Not featured</SelectItem>
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
                    <PropertiesTable
                        properties={properties}
                        onChanged={refresh}
                        constructionTaskStatuses={constructionTaskStatuses}
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

PropertiesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Properties',
            href: '/admin/properties',
        },
    ],
};
