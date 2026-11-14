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
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type TypeRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    properties_count?: number;
};

type Props = { types: TypeRow[]; onChanged: () => void };

export default function TypesTable({ types, onChanged }: Props) {
    const [editType, setEditType] = useState<TypeRow | null>(null);
    const [deleteType, setDeleteType] = useState<TypeRow | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const openEdit = (type: TypeRow) => {
        setEditType(type);
        setName(type.name);
        setSlug(type.slug);
        setIsActive(type.is_active);
        setErrors({});
    };

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(route('admin.properties.types.update', editType!.id), {
                name,
                slug,
                is_active: isActive,
            }),
        onSuccess: () => {
            toast.success('Property type updated successfully.');
            setEditType(null);
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
                error.response?.data?.message || 'Failed to update type.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.properties.types.destroy', deleteType!.id),
            ),
        onSuccess: () => {
            toast.success('Property type deleted successfully.');
            setDeleteType(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete type.',
            );
        },
    });

    if (types.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No types found.
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
                            <TableHead>Properties</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {types.map((type, index) => (
                            <TableRow key={type.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{type.name}</TableCell>
                                <TableCell>{type.slug}</TableCell>
                                <TableCell>
                                    {type.properties_count ?? 0}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            type.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {type.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="rounded p-2 hover:bg-muted"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => openEdit(type)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    setDeleteType(type)
                                                }
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
                open={editType !== null}
                onOpenChange={(open) => !open && setEditType(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Type</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event: FormEvent) => {
                            event.preventDefault();
                            updateMutation.mutate();
                        }}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label required>Name</Label>
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Slug</Label>
                            <Input
                                value={slug}
                                onChange={(event) =>
                                    setSlug(event.target.value)
                                }
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
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteType !== null}
                onOpenChange={(open) => !open && setDeleteType(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete type</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteType?.name}”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteType(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
