import { useMutation } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import { RoleSelect } from '@/pages/users/partials/role-select';

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
    roles: RoleOption[];
};

type Props = {
    user: UserRow;
    roles: RoleOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export default function UpdateUser({
    user,
    roles,
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    const [form, setForm] = useState({
        name: user.name || '',
        email: user.email,
        mobile: user.mobile || '',
        roles: user.roles.map((role) => role.id),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setForm({
                name: user.name || '',
                email: user.email,
                mobile: user.mobile || '',
                roles: user.roles.map((role) => role.id),
            });
            setErrors({});
        }
    }, [open, user]);

    const mutation = useMutation({
        mutationFn: () =>
            webApi.put(route('admin.users.update', user.id), form),
        onSuccess: () => {
            toast.success('User updated successfully.');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: {
            response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        }) => {
            const serverErrors = error.response?.data?.errors || {};
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([field, messages]) => {
                mapped[field] = messages[0];
            });
            setErrors(mapped);
            toast.error(error.response?.data?.message || 'Failed to update user.');
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user profile and roles.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`name-${user.id}`} required>
                            Name
                        </Label>
                        <Input
                            id={`name-${user.id}`}
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`email-${user.id}`} required>
                            Email
                        </Label>
                        <Input
                            id={`email-${user.id}`}
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    email: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`mobile-${user.id}`} required>
                            Mobile
                        </Label>
                        <Input
                            id={`mobile-${user.id}`}
                            value={form.mobile}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    mobile: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.mobile} />
                    </div>
                    {user.referral_code && (
                        <div className="grid gap-2">
                            <Label>Referral code</Label>
                            <Input value={user.referral_code} readOnly />
                        </div>
                    )}
                    <RoleSelect
                        roles={roles}
                        value={form.roles}
                        onChange={(nextRoles) =>
                            setForm((current) => ({
                                ...current,
                                roles: nextRoles,
                            }))
                        }
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
