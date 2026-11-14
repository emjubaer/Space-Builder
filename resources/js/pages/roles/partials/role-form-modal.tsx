import { useMutation } from '@tanstack/react-query';
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PermissionItem } from '@/lib/permissions';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import PermissionSelector from '@/pages/roles/partials/permission-selector';

type Props = {
    mode?: 'create' | 'update';
    roleId?: number;
    permissions?: PermissionItem[];
    initialName?: string;
    initialPermissionIds?: Array<number | { id: number }>;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    onSuccess?: () => void;
};

export default function RoleFormModal({
    mode = 'create',
    roleId,
    permissions = [],
    initialName = '',
    initialPermissionIds = [],
    open: openProp,
    onOpenChange,
    trigger,
    onSuccess,
}: Props) {
    const normalizedInitialPermissionIds = useMemo(
        () =>
            (initialPermissionIds ?? [])
                .map((item) => (typeof item === 'object' ? item.id : item))
                .filter((item): item is number => item !== undefined && item !== null),
        [initialPermissionIds],
    );

    const normalizedInitialPermissionKey = useMemo(
        () => normalizedInitialPermissionIds.join(','),
        [normalizedInitialPermissionIds],
    );

    const [internalOpen, setInternalOpen] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [nameValue, setNameValue] = useState(initialName);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
        normalizedInitialPermissionIds,
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const controlled = openProp !== undefined;
    const open = controlled ? openProp : internalOpen;
    const setOpen = controlled ? onOpenChange! : setInternalOpen;
    const isCreate = mode === 'create';

    const mutation = useMutation({
        mutationFn: (payload: { name: string; permissions: number[] }) =>
            isCreate
                ? webApi.post(route('admin.role.store'), payload)
                : webApi.put(route('admin.role.update', roleId), payload),
        onSuccess: (response) => {
            toast.success(
                response?.data?.message ||
                    (isCreate
                        ? 'Role created successfully.'
                        : 'Role updated successfully.'),
            );
            setErrors({});
            setPermissionModalOpen(false);
            if (isCreate) {
                setNameValue('');
                setSelectedPermissions([]);
            }
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: {
            response?: {
                data?: { message?: string; errors?: Record<string, string[]> };
            };
        }) => {
            const serverErrors = error.response?.data?.errors || {};
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([field, messages]) => {
                mapped[field] = messages[0];
            });
            setErrors(mapped);
            toast.error(
                error.response?.data?.message ||
                    (isCreate
                        ? 'Failed to create role.'
                        : 'Failed to update role.'),
            );
        },
    });

    useEffect(() => {
        if (!open) {
            setPermissionModalOpen(false);

            return;
        }

        setErrors({});
        setNameValue(initialName ?? '');
        setSelectedPermissions(normalizedInitialPermissionIds);
    }, [open, initialName, normalizedInitialPermissionKey]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setErrors({});
        mutation.mutate({
            name: nameValue,
            permissions: selectedPermissions,
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {!controlled && trigger && (
                    <DialogTrigger asChild>{trigger}</DialogTrigger>
                )}
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>
                                {isCreate ? 'Create New Role' : 'Update Role'}
                            </DialogTitle>
                            <DialogDescription>
                                {isCreate
                                    ? 'Create a role and attach permissions.'
                                    : 'Update this role and its permissions.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="role-name" required>
                                    Name
                                </Label>
                                <Input
                                    id="role-name"
                                    name="name"
                                    value={nameValue}
                                    onChange={(event) =>
                                        setNameValue(event.target.value)
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setPermissionModalOpen(true)}
                            >
                                Attach Permissions (
                                {selectedPermissions.length})
                            </Button>
                            <InputError message={errors.permissions} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={permissionModalOpen}
                onOpenChange={setPermissionModalOpen}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Attach Permissions</DialogTitle>
                        <DialogDescription>
                            Select permissions for this role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-1">
                        <PermissionSelector
                            permissions={permissions}
                            selectedPermissionIds={selectedPermissions}
                            onSelectionChange={setSelectedPermissions}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => setPermissionModalOpen(false)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
