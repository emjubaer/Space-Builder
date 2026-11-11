import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    formatPermissionLabel,
    groupPermissions,
    type PermissionItem,
} from '@/lib/permissions';
import DeleteRole from '@/pages/roles/partials/delete-role';
import RoleFormModal from '@/pages/roles/partials/role-form-modal';

export type RoleRow = {
    id: number;
    name: string;
    created_at?: string | null;
    updated_at?: string | null;
    permissions?: PermissionItem[];
};

type Props = {
    roles: RoleRow[];
    permissions: PermissionItem[];
    onChanged: () => void;
};

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString();
}

export default function RolesTable({
    roles,
    permissions,
    onChanged,
}: Props) {
    const [editRole, setEditRole] = useState<RoleRow | null>(null);
    const [deleteRole, setDeleteRole] = useState<RoleRow | null>(null);
    const [viewRole, setViewRole] = useState<RoleRow | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    No roles found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role, index) => {
                                const attached = role.permissions ?? [];

                                return (
                                    <TableRow key={role.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            {role.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex max-w-md flex-wrap gap-1">
                                                {attached.length === 0 ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        None
                                                    </span>
                                                ) : (
                                                    attached
                                                        .slice(0, 4)
                                                        .map((permission) => (
                                                            <Badge
                                                                key={
                                                                    permission.id
                                                                }
                                                                variant="secondary"
                                                            >
                                                                {formatPermissionLabel(
                                                                    permission.name,
                                                                )}
                                                            </Badge>
                                                        ))
                                                )}
                                                {attached.length > 4 && (
                                                    <Badge variant="outline">
                                                        +{attached.length - 4}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(role.updated_at)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Actions"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setViewRole(role)
                                                        }
                                                    >
                                                        View Permissions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setEditRole(role)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onSelect={() =>
                                                            setDeleteRole(role)
                                                        }
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={!!viewRole}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewRole(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg font-semibold">
                            {viewRole?.name} Permissions
                        </DialogTitle>
                    </DialogHeader>
                    {(viewRole?.permissions ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No permissions attached to this role.
                        </p>
                    ) : (
                        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                            {groupPermissions(
                                viewRole?.permissions ?? [],
                            ).map((group) => (
                                <div key={group.groupName}>
                                    <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        {group.label}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.permissions.map((permission) => (
                                            <span
                                                key={permission.id}
                                                className="rounded-md bg-muted px-2 py-1 text-xs font-medium"
                                            >
                                                {formatPermissionLabel(
                                                    permission.action ||
                                                        permission.name,
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {editRole && (
                <RoleFormModal
                    mode="update"
                    roleId={editRole.id}
                    permissions={permissions}
                    initialName={editRole.name}
                    initialPermissionIds={editRole.permissions ?? []}
                    open={!!editRole}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditRole(null);
                        }
                    }}
                    onSuccess={onChanged}
                />
            )}

            {deleteRole && (
                <DeleteRole
                    id={deleteRole.id}
                    open={!!deleteRole}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteRole(null);
                        }
                    }}
                    onSuccess={onChanged}
                />
            )}
        </>
    );
}
