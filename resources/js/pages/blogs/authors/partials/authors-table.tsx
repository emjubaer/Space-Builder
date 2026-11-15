import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/image-upload';
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

export type AuthorRow = {
    id: number;
    slug: string;
    bio: string | null;
    designation: string | null;
    status: boolean;
    blogs_count?: number;
    name?: string | null;
    user?: {
        id: number;
        name: string | null;
        email: string;
        avatar?: string | null;
    } | null;
};

type Props = {
    authors: AuthorRow[];
    onChanged: () => void;
};

export default function AuthorsTable({ authors, onChanged }: Props) {
    const [editAuthor, setEditAuthor] = useState<AuthorRow | null>(null);
    const [deleteAuthor, setDeleteAuthor] = useState<AuthorRow | null>(null);
    const [bio, setBio] = useState('');
    const [designation, setDesignation] = useState('');
    const [status, setStatus] = useState(true);
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const openEdit = (author: AuthorRow) => {
        setEditAuthor(author);
        setBio(author.bio || '');
        setDesignation(author.designation || '');
        setStatus(author.status);
        setAvatar(null);
        setAvatarPreview(author.user?.avatar || null);
        setRemoveAvatar(false);
        setErrors({});
    };

    const updateMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('bio', bio);
            formData.append('designation', designation);
            formData.append('status', status ? '1' : '0');
            formData.append('remove_avatar', removeAvatar ? '1' : '0');

            if (avatar) {
                formData.append('avatar', avatar);
            }

            return webApi.post(
                route('admin.blogs.authors.update', editAuthor!.id),
                formData,
            );
        },
        onSuccess: () => {
            toast.success('Author updated successfully.');
            setEditAuthor(null);
            setAvatar(null);
            setRemoveAvatar(false);
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
                error.response?.data?.message || 'Failed to update author.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.blogs.authors.destroy', deleteAuthor!.id),
            ),
        onSuccess: () => {
            toast.success('Author deleted successfully.');
            setDeleteAuthor(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete author.',
            );
        },
    });

    if (authors.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No authors found.
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
                            <TableHead>Email</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Posts</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {authors.map((author, index) => (
                            <TableRow key={author.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {author.user?.avatar ? (
                                            <img
                                                src={author.user.avatar}
                                                alt={
                                                    author.user?.name ||
                                                    author.name ||
                                                    'Author'
                                                }
                                                className="size-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                                {(
                                                    author.user?.name ||
                                                    author.name ||
                                                    '?'
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <span>
                                            {author.user?.name ||
                                                author.name ||
                                                '—'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {author.user?.email || '—'}
                                </TableCell>
                                <TableCell>
                                    {author.designation || '—'}
                                </TableCell>
                                <TableCell>{author.blogs_count ?? 0}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            author.status
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {author.status ? 'Active' : 'Inactive'}
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
                                                onSelect={() => openEdit(author)}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setDeleteAuthor(author)
                                                }
                                                className="text-destructive focus:text-destructive"
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
                open={editAuthor !== null}
                onOpenChange={(open) => !open && setEditAuthor(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Author</DialogTitle>
                        <DialogDescription>
                            Update author profile details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Avatar</Label>
                            <ImageUpload
                                value={removeAvatar ? null : avatarPreview}
                                onChange={(file) => {
                                    setAvatar(file);
                                    if (file) {
                                        setRemoveAvatar(false);
                                    } else {
                                        setRemoveAvatar(true);
                                        setAvatarPreview(null);
                                    }
                                }}
                            />
                            <InputError message={errors.avatar} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Designation</Label>
                            <Input
                                value={designation}
                                onChange={(event) =>
                                    setDesignation(event.target.value)
                                }
                            />
                            <InputError message={errors.designation} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Bio</Label>
                            <Textarea
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                            />
                            <InputError message={errors.bio} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="author-status"
                                type="checkbox"
                                checked={status}
                                onChange={(event) =>
                                    setStatus(event.target.checked)
                                }
                            />
                            <Label htmlFor="author-status">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteAuthor !== null}
                onOpenChange={(open) => !open && setDeleteAuthor(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Author</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this author?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteAuthor(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
