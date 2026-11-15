import { usePage } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { useCan } from '@/hooks/use-can';
import ChangePasswordUser from '@/pages/users/partials/change-password-user';
import DeleteUser from '@/pages/users/partials/delete-user';
import UpdateUser from '@/pages/users/partials/update-user';

type RoleOption = {
    id: number;
    name: string;
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

type Props = {
    users: UserRow[];
    roles: RoleOption[];
    onChanged: () => void;
};

export default function UsersTable({ users, roles, onChanged }: Props) {
    const can = useCan();
    const currentUserId = usePage().props.auth.user?.id;
    const [editOpenId, setEditOpenId] = useState<number | null>(null);
    const [deleteOpenId, setDeleteOpenId] = useState<number | null>(null);
    const [changePasswordOpenId, setChangePasswordOpenId] = useState<
        number | null
    >(null);

    if (users.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No users found.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user, index) => (
                        <TableRow key={user.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{user.name || '—'}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.mobile || '—'}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <Badge
                                                key={role.id}
                                                variant="secondary"
                                            >
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="rounded p-2 hover:bg-muted focus:outline-none"
                                            aria-label="Actions"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {can('user_update') && (
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setEditOpenId(user.id)
                                                }
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {can('user_update') && (
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setChangePasswordOpenId(
                                                        user.id,
                                                    )
                                                }
                                            >
                                                Change Password
                                            </DropdownMenuItem>
                                        )}
                                        {can('user_delete') && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        setDeleteOpenId(user.id)
                                                    }
                                                    disabled={
                                                        currentUserId ===
                                                        user.id
                                                    }
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <UpdateUser
                                    user={user}
                                    roles={roles}
                                    open={editOpenId === user.id}
                                    onOpenChange={(open) =>
                                        setEditOpenId(open ? user.id : null)
                                    }
                                    onSuccess={onChanged}
                                />

                                <ChangePasswordUser
                                    user={user}
                                    open={changePasswordOpenId === user.id}
                                    onOpenChange={(open) =>
                                        setChangePasswordOpenId(
                                            open ? user.id : null,
                                        )
                                    }
                                    onSuccess={onChanged}
                                />

                                <DeleteUser
                                    user={user}
                                    open={deleteOpenId === user.id}
                                    onOpenChange={(open) =>
                                        setDeleteOpenId(open ? user.id : null)
                                    }
                                    onSuccess={onChanged}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
