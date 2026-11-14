import { Head, Link, router } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ImageField, {
    type ImagePreviewItem,
} from '@/components/image-field';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import ConstructionProgressDialog from '@/pages/properties/partials/construction-progress-dialog';
import { type ConstructionTaskRow } from '@/pages/properties/partials/construction-progress-section';

type Option = {
    id: number;
    name: string | null;
};

type FeatureOption = Option & {
    icon?: string | null;
};

type StatusOption = {
    value: string;
    label: string;
};

type MediaImage = {
    id: number;
    url: string;
    name: string;
};

type PropertyPayload = {
    id: number;
    title: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    location_id: number;
    property_type_id: number;
    land_area: string | number | null;
    land_area_unit: string | null;
    total_floors: number | null;
    apartments_per_floor: number | null;
    apartment_size: string | number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    launch_date: string | null;
    expected_completion_date: string | null;
    status: string;
    is_featured: boolean;
    is_published: boolean;
    feature_ids?: number[];
    cover_image?: MediaImage | null;
    gallery_images?: MediaImage[];
    floor_plan_images?: MediaImage[];
    tour_images?: MediaImage[];
};

type Props = {
    locations: Option[];
    types: Option[];
    features: FeatureOption[];
    statuses: StatusOption[];
    property: PropertyPayload | null;
    constructionTasks?: ConstructionTaskRow[];
    constructionTaskStatuses?: StatusOption[];
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function toPreview(image?: MediaImage | null): ImagePreviewItem | null {
    if (!image) {
        return null;
    }

    return {
        id: image.id,
        url: image.url,
        name: image.name,
    };
}

function toPreviewList(images?: MediaImage[] | null): ImagePreviewItem[] {
    const list = Array.isArray(images) ? images : [];

    return list.map((image) => ({
        id: image.id,
        url: image.url,
        name: image.name,
    }));
}

export default function PropertyCreate({
    locations,
    types,
    features,
    statuses,
    property,
    constructionTasks = [],
    constructionTaskStatuses = [],
}: Props) {
    const isEdit = property !== null;
    const [progressOpen, setProgressOpen] = useState(false);
    const [title, setTitle] = useState(property?.title || '');
    const [slug, setSlug] = useState(property?.slug || '');
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [shortDescription, setShortDescription] = useState(
        property?.short_description || '',
    );
    const [description, setDescription] = useState(property?.description || '');
    const [locationId, setLocationId] = useState(
        property?.location_id ? String(property.location_id) : '',
    );
    const [typeId, setTypeId] = useState(
        property?.property_type_id ? String(property.property_type_id) : '',
    );
    const [status, setStatus] = useState(property?.status || 'draft');
    const [isFeatured, setIsFeatured] = useState(
        property?.is_featured ?? false,
    );
    const [isPublished, setIsPublished] = useState(
        property?.is_published ?? false,
    );
    const [featureIds, setFeatureIds] = useState<number[]>(
        property?.feature_ids || [],
    );
    const [landArea, setLandArea] = useState(
        property?.land_area != null ? String(property.land_area) : '',
    );
    const [landAreaUnit, setLandAreaUnit] = useState(
        property?.land_area_unit || 'katha',
    );
    const [totalFloors, setTotalFloors] = useState(
        property?.total_floors != null ? String(property.total_floors) : '',
    );
    const [apartmentsPerFloor, setApartmentsPerFloor] = useState(
        property?.apartments_per_floor != null
            ? String(property.apartments_per_floor)
            : '',
    );
    const [apartmentSize, setApartmentSize] = useState(
        property?.apartment_size != null
            ? String(property.apartment_size)
            : '',
    );
    const [bedrooms, setBedrooms] = useState(
        property?.bedrooms != null ? String(property.bedrooms) : '',
    );
    const [bathrooms, setBathrooms] = useState(
        property?.bathrooms != null ? String(property.bathrooms) : '',
    );
    const [launchDate, setLaunchDate] = useState(property?.launch_date || '');
    const [expectedCompletionDate, setExpectedCompletionDate] = useState(
        property?.expected_completion_date || '',
    );
    const [coverImage, setCoverImage] = useState<ImagePreviewItem | null>(
        toPreview(property?.cover_image),
    );
    const [galleryImages, setGalleryImages] = useState<ImagePreviewItem[]>(
        toPreviewList(property?.gallery_images),
    );
    const [floorPlanImages, setFloorPlanImages] = useState<ImagePreviewItem[]>(
        toPreviewList(property?.floor_plan_images),
    );
    const [tourImages, setTourImages] = useState<ImagePreviewItem[]>(
        toPreviewList(property?.tour_images),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!slugTouched) {
            setSlug(slugify(title));
        }
    }, [title, slugTouched]);

    const toggleFeature = (id: number) => {
        setFeatureIds((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('slug', slug);
            formData.append('short_description', shortDescription);
            formData.append('description', description);
            formData.append('location_id', locationId);
            formData.append('property_type_id', typeId);
            formData.append('status', status);
            formData.append('is_featured', isFeatured ? '1' : '0');
            formData.append('is_published', isPublished ? '1' : '0');
            formData.append('land_area', landArea);
            formData.append('land_area_unit', landAreaUnit);
            formData.append('total_floors', totalFloors);
            formData.append('apartments_per_floor', apartmentsPerFloor);
            formData.append('apartment_size', apartmentSize);
            formData.append('bedrooms', bedrooms);
            formData.append('bathrooms', bathrooms);
            formData.append('launch_date', launchDate);
            formData.append(
                'expected_completion_date',
                expectedCompletionDate,
            );

            featureIds.forEach((id) => {
                formData.append('feature_ids[]', String(id));
            });

            if (coverImage?.file) {
                formData.append('cover_image', coverImage.file);
            } else if (coverImage?.id) {
                formData.append('existing_cover_ids[]', String(coverImage.id));
            }

            galleryImages.forEach((image) => {
                if (image.id) {
                    formData.append('existing_gallery_ids[]', String(image.id));
                }
                if (image.file) {
                    formData.append('gallery_images[]', image.file);
                }
            });

            floorPlanImages.forEach((image) => {
                if (image.id) {
                    formData.append(
                        'existing_floor_plan_ids[]',
                        String(image.id),
                    );
                }
                if (image.file) {
                    formData.append('floor_plan_images[]', image.file);
                }
            });

            tourImages.forEach((image) => {
                if (image.id) {
                    formData.append('existing_tour_ids[]', String(image.id));
                }
                if (image.file) {
                    formData.append('tour_images[]', image.file);
                }
            });

            if (isEdit && property) {
                formData.append('_method', 'PUT');

                return webApi.post(
                    route('admin.properties.update', property.id),
                    formData,
                );
            }

            return webApi.post(route('admin.properties.store'), formData);
        },
        onSuccess: (response) => {
            toast.success(
                response.data?.message ||
                    (isEdit
                        ? 'Property updated successfully.'
                        : 'Property created successfully.'),
            );
            setErrors({});
            const nextId = response.data?.property?.id as number | undefined;
            if (!isEdit && nextId) {
                router.visit(route('admin.properties.edit', nextId));
                return;
            }
            router.visit(route('admin.properties.index'));
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
                error.response?.data?.message || 'Failed to save property.',
            );
        },
    });

    return (
        <>
            <Head title={isEdit ? 'Edit Property' : 'Create Property'} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('admin.properties.index')}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold">
                                    {isEdit
                                        ? 'Edit Property'
                                        : 'Create Property'}
                                </h1>
                                {property?.status && (
                                    <Badge variant="secondary">
                                        {property.status.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Add listing details, amenities, and media.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {isEdit && property ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setProgressOpen(true)}
                            >
                                Update Progress
                            </Button>
                        ) : null}
                        <Button
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            <Save className="size-4" />
                            {mutation.isPending ? 'Saving...' : 'Save Property'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Basics</h2>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title" required>
                                        Title
                                    </Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(event) => {
                                            setSlugTouched(true);
                                            setSlug(event.target.value);
                                        }}
                                    />
                                    <InputError message={errors.slug} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="short_description">
                                        Short Description
                                    </Label>
                                    <Textarea
                                        id="short_description"
                                        value={shortDescription}
                                        maxLength={1000}
                                        onChange={(event) =>
                                            setShortDescription(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.short_description}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        className="min-h-40"
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Specifications</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="land_area">Land Area</Label>
                                    <Input
                                        id="land_area"
                                        type="number"
                                        step="0.01"
                                        value={landArea}
                                        onChange={(event) =>
                                            setLandArea(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.land_area} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="land_area_unit">
                                        Land Area Unit
                                    </Label>
                                    <Input
                                        id="land_area_unit"
                                        value={landAreaUnit}
                                        onChange={(event) =>
                                            setLandAreaUnit(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.land_area_unit}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="total_floors">
                                        Total Floors
                                    </Label>
                                    <Input
                                        id="total_floors"
                                        type="number"
                                        value={totalFloors}
                                        onChange={(event) =>
                                            setTotalFloors(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.total_floors}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="apartments_per_floor">
                                        Apartments / Floor
                                    </Label>
                                    <Input
                                        id="apartments_per_floor"
                                        type="number"
                                        value={apartmentsPerFloor}
                                        onChange={(event) =>
                                            setApartmentsPerFloor(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.apartments_per_floor}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="apartment_size">
                                        Apartment Size
                                    </Label>
                                    <Input
                                        id="apartment_size"
                                        type="number"
                                        step="0.01"
                                        value={apartmentSize}
                                        onChange={(event) =>
                                            setApartmentSize(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.apartment_size}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        value={bedrooms}
                                        onChange={(event) =>
                                            setBedrooms(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.bedrooms} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bathrooms">Bathrooms</Label>
                                    <Input
                                        id="bathrooms"
                                        type="number"
                                        value={bathrooms}
                                        onChange={(event) =>
                                            setBathrooms(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.bathrooms} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="launch_date">
                                        Launch Date
                                    </Label>
                                    <Input
                                        id="launch_date"
                                        type="date"
                                        value={launchDate}
                                        onChange={(event) =>
                                            setLaunchDate(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.launch_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="expected_completion_date">
                                        Expected Completion
                                    </Label>
                                    <Input
                                        id="expected_completion_date"
                                        type="date"
                                        value={expectedCompletionDate}
                                        onChange={(event) =>
                                            setExpectedCompletionDate(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors.expected_completion_date
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Media</h2>
                            <div className="grid gap-6">
                                <div>
                                    <ImageField
                                        label="Cover Image"
                                        value={coverImage}
                                        onChange={setCoverImage}
                                    />
                                    <InputError message={errors.cover_image} />
                                </div>
                                <div>
                                    <ImageField
                                        label="Gallery Images"
                                        multiple
                                        value={galleryImages}
                                        onChange={setGalleryImages}
                                    />
                                    <InputError
                                        message={errors.gallery_images}
                                    />
                                </div>
                                <div>
                                    <ImageField
                                        label="Floor Plan Images"
                                        multiple
                                        value={floorPlanImages}
                                        onChange={setFloorPlanImages}
                                    />
                                    <InputError
                                        message={errors.floor_plan_images}
                                    />
                                </div>
                                <div>
                                    <ImageField
                                        label="Tour Images"
                                        multiple
                                        value={tourImages}
                                        onChange={setTourImages}
                                    />
                                    <InputError message={errors.tour_images} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Publishing</h2>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label required>Location</Label>
                                    <Select
                                        value={locationId}
                                        onValueChange={setLocationId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((location) => (
                                                <SelectItem
                                                    key={location.id}
                                                    value={String(location.id)}
                                                >
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.location_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label required>Type</Label>
                                    <Select
                                        value={typeId}
                                        onValueChange={setTypeId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((type) => (
                                                <SelectItem
                                                    key={type.id}
                                                    value={String(type.id)}
                                                >
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.property_type_id}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label required>Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((item) => (
                                                <SelectItem
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={(event) =>
                                            setIsPublished(
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Published on website
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(event) =>
                                            setIsFeatured(event.target.checked)
                                        }
                                    />
                                    Featured listing
                                </label>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <h2 className="mb-4 font-medium">Features</h2>
                            {features.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No active features. Create some under
                                    Properties → Features.
                                </p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto pr-1">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {features.map((feature) => (
                                            <label
                                                key={feature.id}
                                                className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={featureIds.includes(
                                                        feature.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleFeature(
                                                            feature.id,
                                                        )
                                                    }
                                                />
                                                <span className="leading-snug">
                                                    {feature.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <InputError message={errors.feature_ids} />
                        </div>
                    </div>
                </div>
            </div>

            {isEdit && property ? (
                <ConstructionProgressDialog
                    open={progressOpen}
                    onOpenChange={setProgressOpen}
                    propertyId={property.id}
                    propertyTitle={property.title}
                    statuses={constructionTaskStatuses}
                    initialTasks={constructionTasks}
                />
            ) : null}
        </>
    );
}

PropertyCreate.layout = {
    breadcrumbs: [
        {
            title: 'Properties',
            href: '/admin/properties',
        },
        {
            title: 'Create',
            href: '/admin/properties/create',
        },
    ],
};
