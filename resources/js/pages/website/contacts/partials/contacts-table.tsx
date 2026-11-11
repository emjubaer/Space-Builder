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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

export type ContactRow = {
    id: number;
    first_name: string;
    last_name: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    status: string;
    created_at: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    contacts: ContactRow[];
    statuses: StatusOption[];
    onChanged: () => void;
};

const statusVariant = (status: string) => {
    switch (status) {
        case 'new':
            return 'default' as const;
        case 'in_progress':
            return 'secondary' as const;
        case 'resolved':
            return 'outline' as const;
        case 'spam':
            return 'destructive' as const;
        default:
            return 'secondary' as const;
    }
};

const formatStatus = (status: string) =>
    status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

export default function ContactsTable({
    contacts,
    statuses,
    onChanged,
}: Props) {
    const [selected, setSelected] = useState<ContactRow | null>(null);
    const [deleteContact, setDeleteContact] = useState<ContactRow | null>(null);
    const [statusValue, setStatusValue] = useState('new');

    const openMutation = useMutation({
        mutationFn: async (contact: ContactRow) => {
            const response = await webApi.get(
                route('admin.website.contacts.show', contact.id),
            );

            return response.data.contact as ContactRow;
        },
        onSuccess: (contact) => {
            setSelected(contact);
            setStatusValue(contact.status);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to open message.',
            );
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) =>
            webApi.put(
                route('admin.website.contacts.status', selected!.id),
                { status },
            ),
        onSuccess: (response) => {
            toast.success(response.data.message || 'Status updated.');
            setSelected(response.data.contact);
            setStatusValue(response.data.contact.status);
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
                route('admin.website.contacts.destroy', deleteContact!.id),
            ),
        onSuccess: () => {
            toast.success('Contact message deleted successfully.');
            setDeleteContact(null);
            if (selected?.id === deleteContact?.id) {
                setSelected(null);
            }
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete message.',
            );
        },
    });

    if (contacts.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No contact messages found.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell>{contact.full_name}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {contact.subject || '—'}
                                </TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={statusVariant(contact.status)}
                                    >
                                        {formatStatus(contact.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(
                                        contact.created_at,
                                    ).toLocaleString()}
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
                                                onSelect={() =>
                                                    openMutation.mutate(contact)
                                                }
                                            >
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onSelect={() =>
                                                    setDeleteContact(contact)
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

            <Sheet
                open={selected !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setSelected(null);
                    }
                }}
            >
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {selected?.subject || 'Contact message'}
                        </SheetTitle>
                        <SheetDescription>
                            From {selected?.full_name} · {selected?.email}
                        </SheetDescription>
                    </SheetHeader>

                    {selected ? (
                        <div className="mt-6 grid gap-4 px-4 pb-4">
                            <div className="grid gap-1 text-sm">
                                <p className="text-muted-foreground">Phone</p>
                                <p>{selected.phone || '—'}</p>
                            </div>
                            <div className="grid gap-1 text-sm">
                                <p className="text-muted-foreground">
                                    Received
                                </p>
                                <p>
                                    {new Date(
                                        selected.created_at,
                                    ).toLocaleString()}
                                </p>
                            </div>
                            <div className="grid gap-1 text-sm">
                                <p className="text-muted-foreground">
                                    Message
                                </p>
                                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                                    {selected.message}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <p className="text-sm text-muted-foreground">
                                    Status
                                </p>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={statusValue}
                                        onValueChange={setStatusValue}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        disabled={
                                            statusMutation.isPending ||
                                            statusValue === selected.status
                                        }
                                        onClick={() =>
                                            statusMutation.mutate(statusValue)
                                        }
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>

            <Dialog
                open={deleteContact !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setDeleteContact(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete contact message</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the inquiry from{' '}
                            {deleteContact?.full_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDeleteContact(null)}
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
