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

type Props = {
    onSuccess: () => void;
};

export default function CreateFeature({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.properties.features.store'), {
                name,
                slug: slug || undefined,
                icon: icon || null,
                is_active: isActive,
            }),
        onSuccess: () => {
            toast.success('Feature created successfully.');
            setOpen(false);
            setName('');
            setSlug('');
            setIcon('');
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
                error.response?.data?.message || 'Failed to create feature.',
            );
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Feature</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Feature</DialogTitle>
                    <DialogDescription>
                        Add an amenity feature for properties.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="feature-name" required>
                            Name
                        </Label>
                        <Input
                            id="feature-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="feature-slug">Slug</Label>
                        <Input
                            id="feature-slug"
                            value={slug}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="Auto-generated if empty"
                        />
                        <InputError message={errors.slug} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="feature-icon">Icon</Label>
                        <Input
                            id="feature-icon"
                            value={icon}
                            onChange={(event) => setIcon(event.target.value)}
                            placeholder="Optional icon key"
                        />
                        <InputError message={errors.icon} />
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
                            {mutation.isPending ? 'Saving...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
