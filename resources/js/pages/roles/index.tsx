import { Head } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { PermissionItem } from '@/lib/permissions';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import CreateRole from '@/pages/roles/partials/create-role';
import RolePermissionTabs from '@/pages/roles/partials/role-permission-tabs';
import RolesTable, {
    type RoleRow,
} from '@/pages/roles/partials/roles-table';

type Props = {
    permissions: PermissionItem[];
};

export default function RolesIndex({ permissions }: Props) {
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
        queryKey: ['roles', page, perPage, debouncedSearch],
        queryFn: async () => {
            const response = await webApi.get(route('admin.role.list'), {
                params: {
                    page,
                    per_page: perPage,
                    search: debouncedSearch || undefined,
                },
            });

            return response.data as {
                data: RoleRow[];
                from: number | null;
                to: number | null;
                total: number;
                current_page: number;
                last_page: number;
            };
        },
    });

    const roles = useMemo(() => data?.data || [], [data]);

    const meta = {
        from: data?.from ?? 0,
        to: data?.to ?? 0,
        total: data?.total ?? 0,
        current_page: data?.current_page ?? page,
        last_page: data?.last_page ?? 1,
    };

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ['roles'] });
    };

    return (
        <>
            <Head title="Roles & Permissions" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Roles & Permissions"
                        description="Manage roles and access permissions"
                    />
                    <CreateRole
                        permissions={permissions}
                        onSuccess={refresh}
                    />
                </div>

                <RolePermissionTabs active="roles" />

                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search role..."
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
                    <RolesTable
                        roles={roles}
                        permissions={permissions}
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

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles & Permissions',
            href: '/admin/role',
        },
    ],
};
