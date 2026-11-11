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
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type Props = {
    onSuccess: () => void;
};

export default function CreateCategory({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('name', name);
            if (slug) {
                formData.append('slug', slug);
            }
            if (description) {
                formData.append('description', description);
            }
            formData.append('is_active', isActive ? '1' : '0');
            if (image) {
                formData.append('image', image);
            }

            return webApi.post(route('admin.blogs.categories.store'), formData);
        },
        onSuccess: () => {
            toast.success('Category created successfully.');
            setOpen(false);
            setName('');
            setSlug('');
            setDescription('');
            setImage(null);
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
                error.response?.data?.message || 'Failed to create category.',
            );
        },
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setErrors({});
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Create Category</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>
                        Add a new blog category.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category-name">Name</Label>
                        <Input
                            id="category-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category-slug">Slug</Label>
                        <Input
                            id="category-slug"
                            value={slug}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="Auto-generated if empty"
                        />
                        <InputError message={errors.slug} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category-description">
                            Description
                        </Label>
                        <Textarea
                            id="category-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category-image">Image</Label>
                        <Input
                            id="category-image"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setImage(event.target.files?.[0] || null)
                            }
                        />
                        <InputError message={errors.image} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="category-active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) =>
                                setIsActive(event.target.checked)
                            }
                        />
                        <Label htmlFor="category-active">Active</Label>
                    </div>
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
