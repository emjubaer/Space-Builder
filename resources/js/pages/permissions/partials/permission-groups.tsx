import { Shield } from 'lucide-react';
import {
    formatPermissionLabel,
    groupPermissions,
    type PermissionItem,
} from '@/lib/permissions';

type Props = {
    data?: PermissionItem[];
};

export default function PermissionGroups({ data = [] }: Props) {
    const groupedPermissions = groupPermissions(data);

    if (groupedPermissions.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-xl border bg-card p-10 text-sm text-muted-foreground">
                No permissions found.
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedPermissions.map((group) => (
                    <div key={group.groupName} className="space-y-2.5">
                        <h3 className="text-sm font-semibold tracking-tight">
                            {group.label}
                        </h3>
                        <ul className="space-y-1.5">
                            {group.permissions.map((permission) => (
                                <li
                                    key={permission.id}
                                    className="flex items-center gap-2 text-sm text-foreground"
                                >
                                    <Shield className="size-4 shrink-0 text-primary" />
                                    <span>
                                        {formatPermissionLabel(
                                            permission.action ||
                                                permission.name,
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
