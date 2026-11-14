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

type Props = { onSuccess: () => void };

export default function CreateLocation({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('address', address);
            formData.append('city', city);
            formData.append('area', area);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('map_url', mapUrl);
            if (image) {
                formData.append('image', image);
            }

            return webApi.post(
                route('admin.properties.locations.store'),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Location created successfully.');
            setOpen(false);
            setName('');
            setAddress('');
            setCity('');
            setArea('');
            setLatitude('');
            setLongitude('');
            setMapUrl('');
            setImage(null);
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
                error.response?.data?.message || 'Failed to create location.',
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Location</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Location</DialogTitle>
                    <DialogDescription>
                        Add a location used by properties.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        mutation.mutate();
                    }}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label required>Name</Label>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Address</Label>
                        <Textarea
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
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
                            onChange={(event) => setMapUrl(event.target.value)}
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
                        <Button type="submit" disabled={mutation.isPending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
