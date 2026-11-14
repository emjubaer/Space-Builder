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

type Option = {
    value: string;
    label: string;
};

type Props = {
    types: Option[];
    videoProviders: Option[];
    onSuccess: () => void;
};

export default function CreateTestimonial({
    types,
    videoProviders,
    onSuccess,
}: Props) {
    const [open, setOpen] = useState(false);
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
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = () => {
        setType('text');
        setReviewerName('');
        setReviewerPosition('');
        setReviewerCompany('');
        setAvatar(null);
        setContent('');
        setRating('');
        setVideoProvider('');
        setVideoId('');
        setVideoUrl('');
        setSortOrder('0');
        setErrors({});
    };

    const mutation = useMutation({
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
            if (avatar) {
                formData.append('reviewer_avatar', avatar);
            }
            if (type === 'video') {
                formData.append('video_provider', videoProvider);
                formData.append('video_id', videoId);
                formData.append('video_url', videoUrl);
            }

            return webApi.post(
                route('admin.website.testimonials.store'),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Testimonial created successfully.');
            setOpen(false);
            resetForm();
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
                error.response?.data?.message ||
                    'Failed to create testimonial.',
            );
        },
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setErrors({});
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Create Testimonial</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Testimonial</DialogTitle>
                    <DialogDescription>
                        Add a text or video testimonial.
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
                        <Label htmlFor="testimonial-name" required>
                            Reviewer name
                        </Label>
                        <Input
                            id="testimonial-name"
                            value={reviewerName}
                            onChange={(event) =>
                                setReviewerName(event.target.value)
                            }
                        />
                        <InputError message={errors.reviewer_name} />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="testimonial-position">
                                Position
                            </Label>
                            <Input
                                id="testimonial-position"
                                value={reviewerPosition}
                                onChange={(event) =>
                                    setReviewerPosition(event.target.value)
                                }
                            />
                            <InputError message={errors.reviewer_position} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="testimonial-company">Company</Label>
                            <Input
                                id="testimonial-company"
                                value={reviewerCompany}
                                onChange={(event) =>
                                    setReviewerCompany(event.target.value)
                                }
                            />
                            <InputError message={errors.reviewer_company} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="testimonial-avatar">Avatar</Label>
                        <Input
                            id="testimonial-avatar"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setAvatar(event.target.files?.[0] || null)
                            }
                        />
                        <InputError message={errors.reviewer_avatar} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="testimonial-content">
                            {type === 'video' ? 'Caption' : 'Content'}
                        </Label>
                        <Textarea
                            id="testimonial-content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                        />
                        <InputError message={errors.content} />
                    </div>
                    {type === 'text' && (
                        <div className="grid gap-2">
                            <Label>Rating</Label>
                            <Select
                                value={rating || 'none'}
                                onValueChange={(value) =>
                                    setRating(value === 'none' ? '' : value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
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
                            <InputError message={errors.rating} />
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
                                <InputError message={errors.video_provider} />
                            </div>
                            {(videoProvider === 'youtube' ||
                                videoProvider === 'vimeo') && (
                                <div className="grid gap-2">
                                    <Label htmlFor="testimonial-video-id" required>
                                        Video ID
                                    </Label>
                                    <Input
                                        id="testimonial-video-id"
                                        value={videoId}
                                        onChange={(event) =>
                                            setVideoId(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.video_id} />
                                </div>
                            )}
                            {videoProvider === 'self_hosted' && (
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="testimonial-video-url"
                                        required
                                    >
                                        Video URL
                                    </Label>
                                    <Input
                                        id="testimonial-video-url"
                                        value={videoUrl}
                                        onChange={(event) =>
                                            setVideoUrl(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.video_url} />
                                </div>
                            )}
                        </>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="testimonial-sort">Sort order</Label>
                        <Input
                            id="testimonial-sort"
                            type="number"
                            min={0}
                            value={sortOrder}
                            onChange={(event) =>
                                setSortOrder(event.target.value)
                            }
                        />
                        <InputError message={errors.sort_order} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
