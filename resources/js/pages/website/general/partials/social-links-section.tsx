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
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type SocialLinkRow = {
    id: number;
    platform: string;
    platform_label?: string;
    url: string;
    is_active: boolean;
    sort_order: number;
};

type PlatformOption = {
    value: string;
    label: string;
};

type Props = {
    links: SocialLinkRow[];
    platforms: PlatformOption[];
    onChanged: () => void;
};

export default function SocialLinksSection({
    links,
    platforms,
    onChanged,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editLink, setEditLink] = useState<SocialLinkRow | null>(null);
    const [deleteLink, setDeleteLink] = useState<SocialLinkRow | null>(null);
    const [platform, setPlatform] = useState(platforms[0]?.value || '');
    const [url, setUrl] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = (link?: SocialLinkRow | null) => {
        setPlatform(link?.platform || platforms[0]?.value || '');
        setUrl(link?.url || '');
        setSortOrder(String(link?.sort_order ?? 0));
        setIsActive(link?.is_active ?? true);
        setErrors({});
    };

    const createMutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.website.general.social-links.store'), {
                platform,
                url,
                sort_order: Number(sortOrder) || 0,
                is_active: isActive,
            }),
        onSuccess: () => {
            toast.success('Social link created successfully.');
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
                error.response?.data?.message || 'Failed to create social link.',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(
                route('admin.website.general.social-links.update', editLink!.id),
                {
                    platform,
                    url,
                    sort_order: Number(sortOrder) || 0,
                    is_active: isActive,
                },
            ),
        onSuccess: () => {
            toast.success('Social link updated successfully.');
            setEditLink(null);
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
                error.response?.data?.message || 'Failed to update social link.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route(
                    'admin.website.general.social-links.destroy',
                    deleteLink!.id,
                ),
            ),
        onSuccess: () => {
            toast.success('Social link deleted successfully.');
            setDeleteLink(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete social link.',
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
                    title="Social links"
                    description="Public social profiles shown on the website."
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
                            Add social link
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add social link</DialogTitle>
                            <DialogDescription>
                                Add a platform URL for your company profile.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitCreate} className="grid gap-4">
                            <SocialLinkFields
                                platforms={platforms}
                                platform={platform}
                                setPlatform={setPlatform}
                                url={url}
                                setUrl={setUrl}
                                sortOrder={sortOrder}
                                setSortOrder={setSortOrder}
                                isActive={isActive}
                                setIsActive={setIsActive}
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

            {links.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                    No social links yet.
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Platform</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.map((link) => (
                                <TableRow key={link.id}>
                                    <TableCell>
                                        {link.platform_label || link.platform}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {link.url}
                                    </TableCell>
                                    <TableCell>{link.sort_order}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                link.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {link.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
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
                                                        setEditLink(link);
                                                        resetForm(link);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={() =>
                                                        setDeleteLink(link)
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
                open={editLink !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setEditLink(null);
                        resetForm();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit social link</DialogTitle>
                        <DialogDescription>
                            Update platform details for this social link.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitUpdate} className="grid gap-4">
                        <SocialLinkFields
                            platforms={platforms}
                            platform={platform}
                            setPlatform={setPlatform}
                            url={url}
                            setUrl={setUrl}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            isActive={isActive}
                            setIsActive={setIsActive}
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
                open={deleteLink !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setDeleteLink(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete social link</DialogTitle>
                        <DialogDescription>
                            This will permanently remove the social link.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDeleteLink(null)}
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

function SocialLinkFields({
    platforms,
    platform,
    setPlatform,
    url,
    setUrl,
    sortOrder,
    setSortOrder,
    isActive,
    setIsActive,
    errors,
}: {
    platforms: PlatformOption[];
    platform: string;
    setPlatform: (value: string) => void;
    url: string;
    setUrl: (value: string) => void;
    sortOrder: string;
    setSortOrder: (value: string) => void;
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    errors: Record<string, string>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label required>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                        {platforms.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.platform} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="social-url" required>
                    URL
                </Label>
                <Input
                    id="social-url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                />
                <InputError message={errors.url} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="social-sort">Sort order</Label>
                <Input
                    id="social-sort"
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                />
                <InputError message={errors.sort_order} />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                />
                Active
            </label>
        </>
    );
}
