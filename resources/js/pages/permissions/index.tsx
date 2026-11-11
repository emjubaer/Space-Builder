import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { PermissionItem } from '@/lib/permissions';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import PermissionGroups from '@/pages/permissions/partials/permission-groups';
import RolePermissionTabs from '@/pages/roles/partials/role-permission-tabs';

export default function PermissionsIndex() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['permissions', debouncedSearch],
        queryFn: async () => {
            const response = await webApi.get(route('admin.permission.list'), {
                params: {
                    search: debouncedSearch || undefined,
                },
            });

            return response.data as { data: PermissionItem[] };
        },
    });

    const permissionData = data?.data || [];

    return (
        <>
            <Head title="Permissions" />

            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Roles & Permissions"
                    description="Manage roles and access permissions"
                />

                <RolePermissionTabs active="permission" />

                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search permission..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="rounded-xl border bg-card p-6">
                        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <PermissionGroups data={permissionData} />
                )}
            </div>
        </>
    );
}

PermissionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles & Permissions',
            href: '/admin/permission',
        },
    ],
};
