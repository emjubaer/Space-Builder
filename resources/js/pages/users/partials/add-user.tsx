import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
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
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import { RoleSelect } from '@/pages/users/partials/role-select';

type RoleOption = {
    id: number;
    name: string;
};

type Props = {
    roles: RoleOption[];
    onSuccess: () => void;
};

type FormState = {
    name: string;
    email: string;
    mobile: string;
    password: string;
    password_confirmation: string;
    roles: number[];
};

const initialState: FormState = {
    name: '',
    email: '',
    mobile: '',
    password: '',
    password_confirmation: '',
    roles: [],
};

export default function AddUser({ roles, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: (payload: FormState) =>
            webApi.post(route('admin.users.store'), payload),
        onSuccess: () => {
            toast.success('User created successfully.');
            setOpen(false);
            setForm(initialState);
            setErrors({});
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
            toast.error(error.response?.data?.message || 'Failed to create user.');
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate(form);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setForm(initialState);
                    setErrors({});
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                        Create a new admin, author, or staff account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
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
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
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
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                            id="mobile"
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
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    password: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={form.password_confirmation}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    password_confirmation: event.target.value,
                                }))
                            }
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
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
                    <InputError message={errors.roles} />
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
