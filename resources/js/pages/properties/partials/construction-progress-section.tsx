import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

export type ConstructionTaskRow = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    status_label?: string | null;
    progress_percentage: number;
    sort_order: number;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    propertyId: number;
    initialTasks: ConstructionTaskRow[];
    statuses: StatusOption[];
    showHeader?: boolean;
};

function statusVariant(
    status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
    if (status === 'completed') {
        return 'default';
    }
    if (status === 'in_progress') {
        return 'outline';
    }
    if (status === 'on_hold') {
        return 'destructive';
    }

    return 'secondary';
}

export default function ConstructionProgressSection({
    propertyId,
    initialTasks,
    statuses,
    showHeader = true,
}: Props) {
    const queryClient = useQueryClient();
    const [tasks, setTasks] = useState<ConstructionTaskRow[]>(initialTasks);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTask, setEditTask] = useState<ConstructionTaskRow | null>(null);
    const [deleteTask, setDeleteTask] = useState<ConstructionTaskRow | null>(
        null,
    );
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [status, setStatus] = useState('pending');
    const [progressDrafts, setProgressDrafts] = useState<
        Record<number, number>
    >({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const averageProgress = useMemo(() => {
        if (tasks.length === 0) {
            return 0;
        }

        const total = tasks.reduce(
            (sum, task) => sum + Number(task.progress_percentage || 0),
            0,
        );

        return Math.round((total / tasks.length) * 10) / 10;
    }, [tasks]);

    const mapErrors = (error: {
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
            error.response?.data?.message || 'Something went wrong.',
        );
    };

    const refreshTasks = async () => {
        const response = await webApi.get(
            route('admin.properties.construction-tasks.index', {
                property: propertyId,
            }),
        );
        const next = (response.data?.data ||
            response.data ||
            []) as ConstructionTaskRow[];
        setTasks(Array.isArray(next) ? next : []);
        void queryClient.invalidateQueries({ queryKey: ['properties'] });
    };

    const createMutation = useMutation({
        mutationFn: () =>
            webApi.post(
                route('admin.properties.construction-tasks.store', {
                    property: propertyId,
                }),
                {
                    title,
                    description: description || null,
                    sort_order: sortOrder ? Number(sortOrder) : undefined,
                    status,
                    progress_percentage: 0,
                },
            ),
        onSuccess: async () => {
            toast.success('Construction task created.');
            setCreateOpen(false);
            setTitle('');
            setDescription('');
            setSortOrder('');
            setStatus('pending');
            setErrors({});
            await refreshTasks();
        },
        onError: mapErrors,
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            webApi.put(
                route('admin.properties.construction-tasks.update', {
                    property: propertyId,
                    constructionTask: editTask!.id,
                }),
                {
                    title,
                    description: description || null,
                    sort_order: sortOrder
                        ? Number(sortOrder)
                        : editTask!.sort_order,
                    status,
                },
            ),
        onSuccess: async () => {
            toast.success('Construction task updated.');
            setEditTask(null);
            setErrors({});
            await refreshTasks();
        },
        onError: mapErrors,
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            webApi.delete(
                route('admin.properties.construction-tasks.destroy', {
                    property: propertyId,
                    constructionTask: deleteTask!.id,
                }),
            ),
        onSuccess: async () => {
            toast.success('Construction task deleted.');
            setDeleteTask(null);
            await refreshTasks();
        },
        onError: mapErrors,
    });

    const progressMutation = useMutation({
        mutationFn: ({
            taskId,
            progress,
            nextStatus,
        }: {
            taskId: number;
            progress: number;
            nextStatus?: string;
        }) =>
            webApi.patch(
                route('admin.properties.construction-tasks.progress', {
                    property: propertyId,
                    constructionTask: taskId,
                }),
                {
                    progress_percentage: progress,
                    status: nextStatus,
                },
            ),
        onSuccess: async () => {
            toast.success('Progress updated.');
            await refreshTasks();
        },
        onError: mapErrors,
    });

    const defaultsMutation = useMutation({
        mutationFn: () =>
            webApi.post(
                route(
                    'admin.properties.construction-tasks.apply-defaults',
                    { property: propertyId },
                ),
            ),
        onSuccess: async (response) => {
            toast.success(
                response.data?.message || 'Default phases applied.',
            );
            const next = (response.data?.tasks ||
                []) as ConstructionTaskRow[];
            if (Array.isArray(next) && next.length > 0) {
                setTasks(next);
            } else {
                await refreshTasks();
            }
        },
        onError: mapErrors,
    });

    const openEdit = (task: ConstructionTaskRow) => {
        setEditTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setSortOrder(String(task.sort_order ?? 0));
        setStatus(task.status);
        setErrors({});
    };

    const progressValue = (task: ConstructionTaskRow) =>
        progressDrafts[task.id] ?? Number(task.progress_percentage || 0);

    return (
        <div className={showHeader ? 'rounded-lg border p-4' : ''}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {showHeader ? (
                    <div>
                        <h2 className="font-medium">Construction Progress</h2>
                        <p className="text-sm text-muted-foreground">
                            Track site phases and update completion as work
                            moves.
                        </p>
                    </div>
                ) : (
                    <div />
                )}
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={defaultsMutation.isPending}
                        onClick={() => defaultsMutation.mutate()}
                    >
                        Apply default phases
                    </Button>
                    <Dialog
                        open={createOpen}
                        onOpenChange={(open) => {
                            setCreateOpen(open);
                            if (!open) {
                                setErrors({});
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button type="button" size="sm">
                                <Plus className="size-4" />
                                Add task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add construction task</DialogTitle>
                                <DialogDescription>
                                    Create a phase for this property.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                onSubmit={(event: FormEvent) => {
                                    event.preventDefault();
                                    createMutation.mutate();
                                }}
                                className="grid gap-4"
                            >
                                <div className="grid gap-2">
                                    <Label required>Title</Label>
                                    <Input
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                                    <div className="grid gap-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={status}
                                            onValueChange={setStatus}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                </div>
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
            </div>

            <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Overall progress
                    </span>
                    <span className="font-semibold tabular-nums">
                        {averageProgress}%
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                            width: `${Math.min(100, Math.max(0, averageProgress))}%`,
                        }}
                    />
                </div>
            </div>

            {tasks.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No construction tasks yet. Apply default phases or add a
                    task.
                </p>
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => {
                        const value = progressValue(task);

                        return (
                            <div
                                key={task.id}
                                className="space-y-3 rounded-md border p-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {task.title}
                                        </p>
                                        {task.description ? (
                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                {task.description}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={statusVariant(task.status)}
                                        >
                                            {task.status_label ||
                                                task.status.replace('_', ' ')}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="rounded p-1.5 hover:bg-muted"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEdit(task)
                                                    }
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        setDeleteTask(task)
                                                    }
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Progress
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            {value}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, value))}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={value}
                                            className="w-full"
                                            onChange={(event) =>
                                                setProgressDrafts(
                                                    (current) => ({
                                                        ...current,
                                                        [task.id]: Number(
                                                            event.target.value,
                                                        ),
                                                    }),
                                                )
                                            }
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                progressMutation.isPending ||
                                                value ===
                                                    Number(
                                                        task.progress_percentage ||
                                                            0,
                                                    )
                                            }
                                            onClick={() =>
                                                progressMutation.mutate({
                                                    taskId: task.id,
                                                    progress: value,
                                                })
                                            }
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog
                open={editTask !== null}
                onOpenChange={(open) => !open && setEditTask(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit construction task</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(event: FormEvent) => {
                            event.preventDefault();
                            updateMutation.mutate();
                        }}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label required>Title</Label>
                            <Input
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                            />
                            <InputError message={errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                open={deleteTask !== null}
                onOpenChange={(open) => !open && setDeleteTask(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete task</DialogTitle>
                        <DialogDescription>
                            Delete “{deleteTask?.title}”?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTask(null)}
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
        </div>
    );
}
