import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';
import ConstructionProgressSection, {
    type ConstructionTaskRow,
} from '@/pages/properties/partials/construction-progress-section';

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: number;
    propertyTitle?: string;
    statuses: StatusOption[];
    initialTasks?: ConstructionTaskRow[];
};

export default function ConstructionProgressDialog({
    open,
    onOpenChange,
    propertyId,
    propertyTitle,
    statuses,
    initialTasks,
}: Props) {
    const [tasks, setTasks] = useState<ConstructionTaskRow[]>(
        initialTasks ?? [],
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);

            if (initialTasks) {
                setTasks(initialTasks);
            } else {
                setTasks([]);
            }

            try {
                const response = await webApi.get(
                    route('admin.properties.construction-tasks.index', {
                        property: propertyId,
                    }),
                );
                const next = (response.data?.data ||
                    response.data ||
                    []) as ConstructionTaskRow[];

                if (!cancelled) {
                    setTasks(Array.isArray(next) ? next : []);
                }
            } catch {
                if (!cancelled && initialTasks) {
                    setTasks(initialTasks);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
        // Seed from initialTasks once per open; avoid refetch loops on array identity.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
    }, [open, propertyId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Update progress</DialogTitle>
                    <DialogDescription>
                        {propertyTitle
                            ? `Manage construction phases for ${propertyTitle}.`
                            : 'Manage construction phases and completion for this property.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto px-6 py-4">
                    {loading && tasks.length === 0 ? (
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <ConstructionProgressSection
                            propertyId={propertyId}
                            initialTasks={tasks}
                            statuses={statuses}
                            showHeader={false}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
