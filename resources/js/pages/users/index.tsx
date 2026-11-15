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
import AddUser from '@/pages/users/partials/add-user';
import UsersTable from '@/pages/users/partials/users-table';

type RoleOption = {
    id: number;
    name: string;
};

type Props = {
    roles: RoleOption[];
};

type UserRow = {
    id: number;
    name: string | null;
    email: string;
    mobile: string | null;
    referral_code: string | null;
    updated_at: string | null;
    roles: RoleOption[];
};

export default function UsersIndex({ roles }: Props) {
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
        queryKey: ['users', page, perPage, debouncedSearch],
        queryFn: async () => {
            const response = await webApi.get(route('admin.users.list'), {
                params: {
                    page,
                    per_page: perPage,
                    search: debouncedSearch || undefined,
                },
            });

            return response.data;
        },
    });

    const users: UserRow[] = useMemo(
        () =>
            (data?.data || []).map(
                (item: {
                    id: number;
                    name: string | null;
                    email: string;
                    mobile: string | null;
                    referral_code: string | null;
                    updated_at: string | null;
                    roles?: RoleOption[];
                }) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    mobile: item.mobile,
                    referral_code: item.referral_code,
                    updated_at: item.updated_at,
                    roles: item.roles || [],
                }),
            ),
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
        void queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    return (
        <>
            <Head title="Users" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Users"
                        description="Manage admin, author, and staff accounts"
                    />
                    {can('user_create') && (
                        <AddUser roles={roles} onSuccess={refresh} />
                    )}
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search name, email, mobile..."
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
                    <UsersTable
                        users={users}
                        roles={roles}
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

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: '/admin/users',
        },
    ],
};
