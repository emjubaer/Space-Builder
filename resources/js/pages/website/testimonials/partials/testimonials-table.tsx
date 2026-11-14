import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal, Star } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

type Option = {
    value: string;
    label: string;
};

export type TestimonialRow = {
    id: number;
    type: string;
    is_active: boolean;
    reviewer_name: string;
    reviewer_position: string | null;
    reviewer_company: string | null;
    reviewer_avatar_url: string | null;
    content: string | null;
    rating: number | null;
    video_provider: string | null;
    video_id: string | null;
    video_url: string | null;
    sort_order: number;
};

type Props = {
    testimonials: TestimonialRow[];
    types: Option[];
    videoProviders: Option[];
    onChanged: () => void;
};

function RatingStars({ rating }: { rating: number | null }) {
    if (!rating) {
        return (
            <span className="text-xs text-muted-foreground italic">—</span>
        );
    }

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    className={`size-3 ${
                        index < rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                    }`}
                />
            ))}
        </div>
    );
}

export default function TestimonialsTable({
    testimonials,
    types,
    videoProviders,
    onChanged,
}: Props) {
    const [editItem, setEditItem] = useState<TestimonialRow | null>(null);
    const [deleteItem, setDeleteItem] = useState<TestimonialRow | null>(null);
    const [type, setType] = useState('text');
    const [reviewerName, setReviewerName] = useState('');
    const [reviewerPosition, setReviewerPosition] = useState('');
    const [reviewerCompany, setReviewerCompany] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [content, setContent] = useState('');
    const [rating, setRating] = useState('');
    const [videoProvider, setVideoProvider] = useState('');
    const [videoId, setVideoId] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const openEdit = (item: TestimonialRow) => {
        setEditItem(item);
        setType(item.type);
        setReviewerName(item.reviewer_name);
        setReviewerPosition(item.reviewer_position || '');
        setReviewerCompany(item.reviewer_company || '');
        setAvatar(null);
        setContent(item.content || '');
        setRating(item.rating != null ? String(item.rating) : '');
        setVideoProvider(item.video_provider || '');
        setVideoId(item.video_id || '');
        setVideoUrl(item.video_url || '');
        setSortOrder(String(item.sort_order ?? 0));
        setIsActive(item.is_active);
        setErrors({});
    };

    const updateMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('reviewer_name', reviewerName);
            formData.append('reviewer_position', reviewerPosition);
            formData.append('reviewer_company', reviewerCompany);
            formData.append('content', content);
            if (rating) {
                formData.append('rating', rating);
            }
            formData.append('sort_order', sortOrder || '0');
            formData.append('is_active', isActive ? '1' : '0');
            if (avatar) {
                formData.append('reviewer_avatar', avatar);
            }
            if (type === 'video') {
                formData.append('video_provider', videoProvider);
                formData.append('video_id', videoId);
                formData.append('video_url', videoUrl);
            }

            return webApi.post(
                route('admin.website.testimonials.update', editItem!.id),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Testimonial updated successfully.');
            setEditItem(null);
            setAvatar(null);
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
                error.response?.data?.message ||
                    'Failed to update testimonial.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.website.testimonials.destroy', deleteItem!.id),
            ),
        onSuccess: () => {
            toast.success('Testimonial deleted successfully.');
            setDeleteItem(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message ||
                    'Failed to delete testimonial.',
            );
        },
    });

    if (testimonials.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No testimonials found.
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
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {testimonials.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {item.reviewer_avatar_url ? (
                                            <img
                                                src={item.reviewer_avatar_url}
                                                alt=""
                                                className="size-9 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                {item.reviewer_name
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {item.reviewer_name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {[
                                                    item.reviewer_position,
                                                    item.reviewer_company,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{item.type}</Badge>
                                </TableCell>
                                <TableCell className="max-w-56 truncate">
                                    {item.content || '—'}
                                </TableCell>
                                <TableCell>
                                    <RatingStars rating={item.rating} />
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            item.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {item.is_active
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
                                                onClick={() => openEdit(item)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    setDeleteItem(item)
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
                open={editItem !== null}
                onOpenChange={(open) => !open && setEditItem(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Testimonial</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event: FormEvent) => {
                            event.preventDefault();
                            updateMutation.mutate();
                        }}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label required>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Reviewer name</Label>
                            <Input
                                value={reviewerName}
                                onChange={(event) =>
                                    setReviewerName(event.target.value)
                                }
                            />
                            <InputError message={errors.reviewer_name} />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                            <div className="grid gap-2">
                                <Label>Position</Label>
                                <Input
                                    value={reviewerPosition}
                                    onChange={(event) =>
                                        setReviewerPosition(event.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Company</Label>
                                <Input
                                    value={reviewerCompany}
                                    onChange={(event) =>
                                        setReviewerCompany(event.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Avatar</Label>
                            {editItem?.reviewer_avatar_url && (
                                <img
                                    src={editItem.reviewer_avatar_url}
                                    alt=""
                                    className="size-12 rounded-full object-cover"
                                />
                            )}
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setAvatar(event.target.files?.[0] || null)
                                }
                            />
                            <InputError message={errors.reviewer_avatar} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {type === 'video' ? 'Caption' : 'Content'}
                            </Label>
                            <Textarea
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                            />
                        </div>
                        {type === 'text' && (
                            <div className="grid gap-2">
                                <Label>Rating</Label>
                                <Select
                                    value={rating || 'none'}
                                    onValueChange={(value) =>
                                        setRating(
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Optional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <SelectItem
                                                key={value}
                                                value={String(value)}
                                            >
                                                {value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {type === 'video' && (
                            <>
                                <div className="grid gap-2">
                                    <Label required>Video provider</Label>
                                    <Select
                                        value={videoProvider}
                                        onValueChange={setVideoProvider}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {videoProviders.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.video_provider}
                                    />
                                </div>
                                {(videoProvider === 'youtube' ||
                                    videoProvider === 'vimeo') && (
                                    <div className="grid gap-2">
                                        <Label required>Video ID</Label>
                                        <Input
                                            value={videoId}
                                            onChange={(event) =>
                                                setVideoId(event.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.video_id}
                                        />
                                    </div>
                                )}
                                {videoProvider === 'self_hosted' && (
                                    <div className="grid gap-2">
                                        <Label required>Video URL</Label>
                                        <Input
                                            value={videoUrl}
                                            onChange={(event) =>
                                                setVideoUrl(event.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.video_url}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="grid gap-2">
                            <Label>Sort order</Label>
                            <Input
                                type="number"
                                min={0}
                                value={sortOrder}
                                onChange={(event) =>
                                    setSortOrder(event.target.value)
                                }
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="testimonial-active"
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(event.target.checked)
                                }
                            />
                            <Label htmlFor="testimonial-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteItem !== null}
                onOpenChange={(open) => !open && setDeleteItem(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete testimonial</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteItem?.reviewer_name}”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteItem(null)}
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
