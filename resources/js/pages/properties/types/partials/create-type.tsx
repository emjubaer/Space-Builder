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

type Props = { onSuccess: () => void };

export default function CreateType({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.properties.types.store'), {
                name,
                slug: slug || undefined,
                is_active: isActive,
            }),
        onSuccess: () => {
            toast.success('Property type created successfully.');
            setOpen(false);
            setName('');
            setSlug('');
            setIsActive(true);
            setErrors({});
            onSuccess();
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
                error.response?.data?.message || 'Failed to create type.',
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Type</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Type</DialogTitle>
                    <DialogDescription>
                        Add a property type (apartment, villa, etc.).
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label required>Name</Label>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Slug</Label>
                        <Input
                            value={slug}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="Auto-generated if empty"
                        />
                        <InputError message={errors.slug} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) =>
                                setIsActive(event.target.checked)
                            }
                        />
                        Active
                    </label>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
