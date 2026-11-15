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
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type SubscriberRow = {
    id: number;
    email: string;
    is_active: boolean;
    subscribed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    subscribers: SubscriberRow[];
    onChanged: () => void;
};

export default function SubscribersTable({ subscribers, onChanged }: Props) {
    const [deleteSubscriber, setDeleteSubscriber] =
        useState<SubscriberRow | null>(null);

    const statusMutation = useMutation({
        mutationFn: ({
            subscriber,
            isActive,
        }: {
            subscriber: SubscriberRow;
            isActive: boolean;
        }) =>
            webApi.put(
                route('admin.website.newsletter.status', subscriber.id),
                { is_active: isActive },
            ),
        onSuccess: (response) => {
            toast.success(response.data.message || 'Status updated.');
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to update status.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route(
                    'admin.website.newsletter.destroy',
                    deleteSubscriber!.id,
                ),
            ),
        onSuccess: () => {
            toast.success('Subscriber deleted successfully.');
            setDeleteSubscriber(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete subscriber.',
            );
        },
    });

    if (subscribers.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No newsletter subscribers found.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscribed</TableHead>
                            <TableHead className="w-16">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscribers.map((subscriber) => (
                            <TableRow key={subscriber.id}>
                                <TableCell className="font-medium">
                                    {subscriber.email}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            subscriber.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {subscriber.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {subscriber.subscribed_at
                                        ? new Date(
                                              subscriber.subscribed_at,
                                          ).toLocaleString()
                                        : '—'}
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
                                                disabled={
                                                    statusMutation.isPending
                                                }
                                                onSelect={() =>
                                                    statusMutation.mutate({
                                                        subscriber,
                                                        isActive:
                                                            !subscriber.is_active,
                                                    })
                                                }
                                            >
                                                {subscriber.is_active
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onSelect={() =>
                                                    setDeleteSubscriber(
                                                        subscriber,
                                                    )
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
                open={deleteSubscriber !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setDeleteSubscriber(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete subscriber</DialogTitle>
                        <DialogDescription>
                            This will permanently remove{' '}
                            {deleteSubscriber?.email} from the newsletter list.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDeleteSubscriber(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            type="button"
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
        </>
    );
}
