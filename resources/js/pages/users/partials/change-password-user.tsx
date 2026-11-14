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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type Props = {
    user: { id: number; name: string | null; email: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export default function ChangePasswordUser({
    user,
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.users.change-password', user.id), {
                password,
                password_confirmation: passwordConfirmation,
            }),
        onSuccess: () => {
            toast.success('Password changed successfully.');
            setPassword('');
            setPasswordConfirmation('');
            setErrors({});
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
            toast.error(
                error.response?.data?.message || 'Failed to change password.',
            );
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
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {user.name || user.email}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`password-${user.id}`} required>
                            Password
                        </Label>
                        <Input
                            id={`password-${user.id}`}
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor={`password-confirmation-${user.id}`}
                            required
                        >
                            Confirm password
                        </Label>
                        <Input
                            id={`password-confirmation-${user.id}`}
                            type="password"
                            value={passwordConfirmation}
                            onChange={(event) =>
                                setPasswordConfirmation(event.target.value)
                            }
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Update password'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
