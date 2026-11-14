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

export type FeatureRow = {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    is_active: boolean;
    properties_count?: number;
};

type Props = {
    features: FeatureRow[];
    onChanged: () => void;
};

export default function FeaturesTable({ features, onChanged }: Props) {
    const [editFeature, setEditFeature] = useState<FeatureRow | null>(null);
    const [deleteFeature, setDeleteFeature] = useState<FeatureRow | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const openEdit = (feature: FeatureRow) => {
        setEditFeature(feature);
        setName(feature.name);
        setSlug(feature.slug);
        setIcon(feature.icon || '');
        setIsActive(feature.is_active);
        setErrors({});
    };

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(
                route('admin.properties.features.update', editFeature!.id),
                {
                    name,
                    slug,
                    icon: icon || null,
                    is_active: isActive,
                },
            ),
        onSuccess: () => {
            toast.success('Feature updated successfully.');
            setEditFeature(null);
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
                error.response?.data?.message || 'Failed to update feature.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.properties.features.destroy', deleteFeature!.id),
            ),
        onSuccess: () => {
            toast.success('Feature deleted successfully.');
            setDeleteFeature(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete feature.',
            );
        },
    });

    if (features.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No features found.
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
                        {features.map((feature, index) => (
                            <TableRow key={feature.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{feature.name}</TableCell>
                                <TableCell>{feature.slug}</TableCell>
                                <TableCell>
                                    {feature.properties_count ?? 0}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            feature.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {feature.is_active
                                            ? 'Active'
                                            : 'Inactive'}
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
                                                onClick={() =>
                                                    openEdit(feature)
                                                }
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    setDeleteFeature(feature)
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
                open={editFeature !== null}
                onOpenChange={(open) => !open && setEditFeature(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Feature</DialogTitle>
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
                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Input
                                value={icon}
                                onChange={(event) =>
                                    setIcon(event.target.value)
                                }
                            />
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
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteFeature !== null}
                onOpenChange={(open) => !open && setDeleteFeature(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete feature</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteFeature?.name}”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteFeature(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteMutation.isPending}
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
