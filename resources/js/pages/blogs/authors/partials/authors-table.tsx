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

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(route('admin.blogs.authors.update', editAuthor!.id), {
                bio,
                designation,
                status,
            }),
        onSuccess: () => {
            toast.success('Author updated successfully.');
            setEditAuthor(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
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
                                    {author.user?.name || author.name || '—'}
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
                                                onSelect={() => {
                                                    setEditAuthor(author);
                                                    setBio(author.bio || '');
                                                    setDesignation(
                                                        author.designation ||
                                                            '',
                                                    );
                                                    setStatus(author.status);
                                                }}
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
                            <Label>Designation</Label>
                            <Input
                                value={designation}
                                onChange={(event) =>
                                    setDesignation(event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Bio</Label>
                            <Textarea
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                            />
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
