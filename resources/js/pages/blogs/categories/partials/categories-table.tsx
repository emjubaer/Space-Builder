import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    blogs_count?: number;
};

type Props = {
    categories: CategoryRow[];
    onChanged: () => void;
};

export default function CategoriesTable({ categories, onChanged }: Props) {
    const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);
    const [deleteCategory, setDeleteCategory] = useState<CategoryRow | null>(
        null,
    );
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('slug', slug);
            formData.append('description', description);
            formData.append('is_active', isActive ? '1' : '0');
            formData.append('_method', 'PUT');
            if (image) {
                formData.append('image', image);
            }

            return webApi.post(
                route('admin.blogs.categories.update', editCategory!.id),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Category updated successfully.');
            setEditCategory(null);
            setImage(null);
            setErrors({});
            onChanged();
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
                error.response?.data?.message || 'Failed to update category.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.blogs.categories.destroy', deleteCategory!.id),
            ),
        onSuccess: () => {
            toast.success('Category deleted successfully.');
            setDeleteCategory(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete category.',
            );
        },
    });

    const submitUpdate = (event: FormEvent) => {
        event.preventDefault();
        updateMutation.mutate();
    };

    if (categories.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No categories found.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Posts</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category, index) => (
                            <TableRow key={category.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.slug}</TableCell>
                                <TableCell>
                                    {category.blogs_count ?? 0}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            category.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {category.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
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
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setEditCategory(category);
                                                    setName(category.name);
                                                    setSlug(category.slug);
                                                    setDescription(
                                                        category.description ||
                                                            '',
                                                    );
                                                    setIsActive(
                                                        category.is_active,
                                                    );
                                                    setImage(null);
                                                    setErrors({});
                                                }}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setDeleteCategory(category)
                                                }
                                                className="text-destructive focus:text-destructive"
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={editCategory !== null}
                onOpenChange={(open) => !open && setEditCategory(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Category</DialogTitle>
                        <DialogDescription>
                            Update category details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitUpdate} className="grid gap-4">
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
                            />
                            <InputError message={errors.slug} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setImage(event.target.files?.[0] || null)
                                }
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="edit-category-active"
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(event.target.checked)
                                }
                            />
                            <Label htmlFor="edit-category-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteCategory !== null}
                onOpenChange={(open) => !open && setDeleteCategory(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this category?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteCategory(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
