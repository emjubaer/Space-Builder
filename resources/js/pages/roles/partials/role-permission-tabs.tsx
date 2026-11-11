import { Link } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { route } from '@/lib/route';

type Props = {
    active: 'roles' | 'permission';
};

export default function RolePermissionTabs({ active }: Props) {
    return (
        <Tabs value={active} className="w-full">
            <TabsList>
                <TabsTrigger value="roles" asChild>
                    <Link href={route('admin.role.index')}>Roles</Link>
                </TabsTrigger>
                <TabsTrigger value="permission" asChild>
                    <Link href={route('admin.permission.index')}>
                        Permissions
                    </Link>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
