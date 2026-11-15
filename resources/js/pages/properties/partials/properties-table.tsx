import { Link } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCan } from '@/hooks/use-can';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import ConstructionProgressDialog from '@/pages/properties/partials/construction-progress-dialog';

export type PropertyRow = {
    id: number;
    title: string;
    slug: string;
    status: string;
    is_featured: boolean;
    is_published: boolean;
    location?: { id: number; name: string; city?: string | null } | null;
    property_type?: { id: number; name: string } | null;
    cover_image?: { url: string } | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    properties: PropertyRow[];
    onChanged: () => void;
    constructionTaskStatuses: StatusOption[];
};

export default function PropertiesTable({
    properties,
    onChanged,
    constructionTaskStatuses,
}: Props) {
    const can = useCan();
    const [deleteProperty, setDeleteProperty] = useState<PropertyRow | null>(
        null,
    );
    const [progressProperty, setProgressProperty] =
        useState<PropertyRow | null>(null);

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.properties.destroy', deleteProperty!.id),
            ),
        onSuccess: () => {
            toast.success('Property deleted successfully.');
            setDeleteProperty(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete property.',
            );
        },
    });

    if (properties.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No properties found.
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
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Flags</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {properties.map((property, index) => (
                            <TableRow key={property.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <div className="font-medium">
                                        {property.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {property.slug}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {property.property_type?.name ?? '—'}
                                </TableCell>
                                <TableCell>
                                    {property.location?.name ?? '—'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {property.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="space-x-1">
                                    {property.is_published && (
                                        <Badge>Published</Badge>
                                    )}
                                    {property.is_featured && (
                                        <Badge variant="outline">
                                            Featured
                                        </Badge>
                                    )}
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
                                            {can('property_update') && (
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={route(
                                                            'admin.properties.edit',
                                                            property.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {can('property_update') && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setProgressProperty(
                                                            property,
                                                        )
                                                    }
                                                >
                                                    Update Progress
                                                </DropdownMenuItem>
                                            )}
                                            {can('property_delete') && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            setDeleteProperty(
                                                                property,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={deleteProperty !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteProperty(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete property</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteProperty?.title}”? This cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProperty(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate()}
                        >
                            {deleteMutation.isPending
                                ? 'Deleting...'
                                : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {progressProperty ? (
                <ConstructionProgressDialog
                    open={progressProperty !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setProgressProperty(null);
                        }
                    }}
                    propertyId={progressProperty.id}
                    propertyTitle={progressProperty.title}
                    statuses={constructionTaskStatuses}
                />
            ) : null}
        </>
    );
}
