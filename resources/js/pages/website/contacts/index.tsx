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
import ContactsTable, {
    type ContactRow,
} from '@/pages/website/contacts/partials/contacts-table';

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    statuses: StatusOption[];
};

export default function ContactsIndex({ statuses }: Props) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
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
            'website-contacts',
            page,
            perPage,
            debouncedSearch,
            status,
        ],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.website.contacts.list'),
                {
                    params: {
                        page,
                        per_page: perPage,
                        search: debouncedSearch || undefined,
                        status: status === 'all' ? undefined : status,
                    },
                },
            );

            return response.data;
        },
    });

    const contacts: ContactRow[] = useMemo(
        () => (data?.data || []) as ContactRow[],
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
        void queryClient.invalidateQueries({ queryKey: ['website-contacts'] });
    };

    return (
        <>
            <Head title="Contact Messages" />

            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Contact messages"
                    description="Review and manage inquiries from the public contact form."
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
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
                    <ContactsTable
                        contacts={contacts}
                        statuses={statuses}
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

ContactsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Contact Messages',
            href: '/admin/website/contacts',
        },
    ],
};
