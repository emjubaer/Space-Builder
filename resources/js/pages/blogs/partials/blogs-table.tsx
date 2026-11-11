import { router } from '@inertiajs/react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type BlogRow = {
    id: number;
    title: string;
    slug: string;
    status: string;
    published_at: string | null;
    category?: { id: number; name: string } | null;
    author?: {
        id: number;
        name?: string | null;
        user?: { id: number; name: string | null } | null;
    } | null;
};

type Props = {
    blogs: BlogRow[];
    onChanged: () => void;
};

export default function BlogsTable({ blogs, onChanged }: Props) {
    const [deleteBlog, setDeleteBlog] = useState<BlogRow | null>(null);

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            action,
        }: {
            id: number;
            action: 'draft' | 'published';
        }) =>
            webApi.post(
                action === 'draft'
                    ? route('admin.blogs.mark-as-draft', id)
                    : route('admin.blogs.mark-as-published', id),
            ),
        onSuccess: (_data, variables) => {
            toast.success(
                variables.action === 'draft'
                    ? 'Blog post marked as draft.'
                    : 'Blog post published.',
            );
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
            webApi.delete(route('admin.blogs.destroy', deleteBlog!.id)),
        onSuccess: () => {
            toast.success('Blog post deleted successfully.');
            setDeleteBlog(null);
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to delete blog post.',
            );
        },
    });

    if (blogs.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No blog posts found.
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
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {blogs.map((blog, index) => (
                            <TableRow key={blog.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="max-w-[240px] truncate font-medium">
                                    {blog.title}
                                </TableCell>
                                <TableCell>
                                    {blog.category?.name || '—'}
                                </TableCell>
                                <TableCell>
                                    {blog.author?.user?.name ||
                                        blog.author?.name ||
                                        '—'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            blog.status === 'published'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {blog.status}
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
                                                onSelect={() =>
                                                    router.visit(
                                                        route(
                                                            'admin.blogs.edit',
                                                            blog.id,
                                                        ),
                                                    )
                                                }
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            {blog.status === 'draft' ? (
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        statusMutation.mutate({
                                                            id: blog.id,
                                                            action: 'published',
                                                        })
                                                    }
                                                >
                                                    Publish
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        statusMutation.mutate({
                                                            id: blog.id,
                                                            action: 'draft',
                                                        })
                                                    }
                                                >
                                                    Mark as Draft
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    window.open(
                                                        route(
                                                            'admin.blogs.preview',
                                                            blog.id,
                                                        ),
                                                        '_blank',
                                                    )
                                                }
                                            >
                                                Admin Preview
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setDeleteBlog(blog)
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
                open={deleteBlog !== null}
                onOpenChange={(open) => !open && setDeleteBlog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete “{deleteBlog?.title}
                            ”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteBlog(null)}
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
