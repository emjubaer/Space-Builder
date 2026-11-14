import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
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

export type LocationRow = {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    area: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    map_url: string | null;
    properties_count?: number;
};

type Props = { locations: LocationRow[]; onChanged: () => void };

export default function LocationsTable({ locations, onChanged }: Props) {
    const [editLocation, setEditLocation] = useState<LocationRow | null>(null);
    const [deleteLocation, setDeleteLocation] = useState<LocationRow | null>(
        null,
    );
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const openEdit = (location: LocationRow) => {
        setEditLocation(location);
        setName(location.name);
        setAddress(location.address || '');
        setCity(location.city || '');
        setArea(location.area || '');
        setLatitude(
            location.latitude !== null && location.latitude !== undefined
                ? String(location.latitude)
                : '',
        );
        setLongitude(
            location.longitude !== null && location.longitude !== undefined
                ? String(location.longitude)
                : '',
        );
        setMapUrl(location.map_url || '');
        setImage(null);
        setErrors({});
    };

    const updateMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('address', address);
            formData.append('city', city);
            formData.append('area', area);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('map_url', mapUrl);
            formData.append('_method', 'PUT');
            if (image) {
                formData.append('image', image);
            }

            return webApi.post(
                route('admin.properties.locations.update', editLocation!.id),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Location updated successfully.');
            setEditLocation(null);
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
                error.response?.data?.message || 'Failed to update location.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.properties.locations.destroy', deleteLocation!.id),
            ),
        onSuccess: () => {
            toast.success('Location deleted successfully.');
            setDeleteLocation(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete location.',
            );
        },
    });

    if (locations.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No locations found.
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
                            <TableHead>City</TableHead>
                            <TableHead>Area</TableHead>
                            <TableHead>Properties</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.map((location, index) => (
                            <TableRow key={location.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{location.name}</TableCell>
                                <TableCell>{location.city ?? '—'}</TableCell>
                                <TableCell>{location.area ?? '—'}</TableCell>
                                <TableCell>
                                    {location.properties_count ?? 0}
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
                                                    openEdit(location)
                                                }
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    setDeleteLocation(location)
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
                open={editLocation !== null}
                onOpenChange={(open) => !open && setEditLocation(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
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
                            <Label>Address</Label>
                            <Textarea
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                            <div className="grid gap-2">
                                <Label>City</Label>
                                <Input
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Area</Label>
                                <Input
                                    value={area}
                                    onChange={(event) =>
                                        setArea(event.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                            <div className="grid gap-2">
                                <Label required>Latitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(event) =>
                                        setLatitude(event.target.value)
                                    }
                                    placeholder="23.8103000"
                                />
                                <InputError message={errors.latitude} />
                            </div>
                            <div className="grid gap-2">
                                <Label required>Longitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(event) =>
                                        setLongitude(event.target.value)
                                    }
                                    placeholder="90.4125000"
                                />
                                <InputError message={errors.longitude} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Map URL</Label>
                            <Input
                                value={mapUrl}
                                onChange={(event) =>
                                    setMapUrl(event.target.value)
                                }
                            />
                            <InputError message={errors.map_url} />
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
                        <DialogFooter>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteLocation !== null}
                onOpenChange={(open) => !open && setDeleteLocation(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete location</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteLocation?.name}”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteLocation(null)}
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
