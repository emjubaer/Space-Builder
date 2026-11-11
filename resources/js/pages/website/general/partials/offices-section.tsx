import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
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
    DialogTrigger,
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

export type OfficeRow = {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    is_head_office: boolean;
    latitude: number | null;
    longitude: number | null;
};

type Props = {
    offices: OfficeRow[];
    onChanged: () => void;
};

export default function OfficesSection({ offices, onChanged }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOffice, setEditOffice] = useState<OfficeRow | null>(null);
    const [deleteOffice, setDeleteOffice] = useState<OfficeRow | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isHeadOffice, setIsHeadOffice] = useState(false);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = (office?: OfficeRow | null) => {
        setName(office?.name || '');
        setAddress(office?.address || '');
        setPhone(office?.phone || '');
        setEmail(office?.email || '');
        setIsHeadOffice(office?.is_head_office ?? false);
        setLatitude(
            office?.latitude !== null && office?.latitude !== undefined
                ? String(office.latitude)
                : '',
        );
        setLongitude(
            office?.longitude !== null && office?.longitude !== undefined
                ? String(office.longitude)
                : '',
        );
        setErrors({});
    };

    const createMutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.website.general.offices.store'), {
                name,
                address,
                phone,
                email,
                is_head_office: isHeadOffice,
                latitude: latitude || null,
                longitude: longitude || null,
            }),
        onSuccess: () => {
            toast.success('Office created successfully.');
            setCreateOpen(false);
            resetForm();
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
                error.response?.data?.message || 'Failed to create office.',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(
                route('admin.website.general.offices.update', editOffice!.id),
                {
                    name,
                    address,
                    phone,
                    email,
                    is_head_office: isHeadOffice,
                    latitude: latitude || null,
                    longitude: longitude || null,
                },
            ),
        onSuccess: () => {
            toast.success('Office updated successfully.');
            setEditOffice(null);
            resetForm();
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
                error.response?.data?.message || 'Failed to update office.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route(
                    'admin.website.general.offices.destroy',
                    deleteOffice!.id,
                ),
            ),
        onSuccess: () => {
            toast.success('Office deleted successfully.');
            setDeleteOffice(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete office.',
            );
        },
    });

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();
        createMutation.mutate();
    };

    const submitUpdate = (event: FormEvent) => {
        event.preventDefault();
        updateMutation.mutate();
    };

    return (
        <div className="grid gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Offices"
                    description="Company locations shown on the public website."
                />
                <Dialog
                    open={createOpen}
                    onOpenChange={(next) => {
                        setCreateOpen(next);
                        if (!next) {
                            resetForm();
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setCreateOpen(true);
                            }}
                        >
                            Add office
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add office</DialogTitle>
                            <DialogDescription>
                                Add a company office or branch location.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitCreate} className="grid gap-4">
                            <OfficeFields
                                name={name}
                                setName={setName}
                                address={address}
                                setAddress={setAddress}
                                phone={phone}
                                setPhone={setPhone}
                                email={email}
                                setEmail={setEmail}
                                isHeadOffice={isHeadOffice}
                                setIsHeadOffice={setIsHeadOffice}
                                latitude={latitude}
                                setLatitude={setLatitude}
                                longitude={longitude}
                                setLongitude={setLongitude}
                                errors={errors}
                            />
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending
                                        ? 'Saving...'
                                        : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {offices.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                    No offices yet.
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offices.map((office) => (
                                <TableRow key={office.id}>
                                    <TableCell>{office.name}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{office.email || '—'}</div>
                                            <div className="text-muted-foreground">
                                                {office.phone || '—'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {office.address || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {office.is_head_office ? (
                                            <Badge>Head office</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Branch
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
                                                <DropdownMenuItem
                                                    onSelect={() => {
                                                        setEditOffice(office);
                                                        resetForm(office);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={() =>
                                                        setDeleteOffice(office)
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
            )}

            <Dialog
                open={editOffice !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setEditOffice(null);
                        resetForm();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit office</DialogTitle>
                        <DialogDescription>
                            Update office details. Only one head office is kept.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitUpdate} className="grid gap-4">
                        <OfficeFields
                            name={name}
                            setName={setName}
                            address={address}
                            setAddress={setAddress}
                            phone={phone}
                            setPhone={setPhone}
                            email={email}
                            setEmail={setEmail}
                            isHeadOffice={isHeadOffice}
                            setIsHeadOffice={setIsHeadOffice}
                            latitude={latitude}
                            setLatitude={setLatitude}
                            longitude={longitude}
                            setLongitude={setLongitude}
                            errors={errors}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteOffice !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setDeleteOffice(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete office</DialogTitle>
                        <DialogDescription>
                            This will permanently remove the office.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDeleteOffice(null)}
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
        </div>
    );
}

function OfficeFields({
    name,
    setName,
    address,
    setAddress,
    phone,
    setPhone,
    email,
    setEmail,
    isHeadOffice,
    setIsHeadOffice,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    errors,
}: {
    name: string;
    setName: (value: string) => void;
    address: string;
    setAddress: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
    isHeadOffice: boolean;
    setIsHeadOffice: (value: boolean) => void;
    latitude: string;
    setLatitude: (value: string) => void;
    longitude: string;
    setLongitude: (value: string) => void;
    errors: Record<string, string>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="office-name">Name</Label>
                <Input
                    id="office-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <InputError message={errors.name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="office-address">Address</Label>
                <Textarea
                    id="office-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                />
                <InputError message={errors.address} />
            </div>
            <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="office-email">Email</Label>
                    <Input
                        id="office-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="office-phone">Phone</Label>
                    <Input
                        id="office-phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                    />
                    <InputError message={errors.phone} />
                </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="office-latitude">Latitude</Label>
                    <Input
                        id="office-latitude"
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(event) => setLatitude(event.target.value)}
                        placeholder="23.8103000"
                    />
                    <InputError message={errors.latitude} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="office-longitude">Longitude</Label>
                    <Input
                        id="office-longitude"
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(event) => setLongitude(event.target.value)}
                        placeholder="90.4125000"
                    />
                    <InputError message={errors.longitude} />
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isHeadOffice}
                    onChange={(event) => setIsHeadOffice(event.target.checked)}
                />
                Head office
            </label>
        </>
    );
}
