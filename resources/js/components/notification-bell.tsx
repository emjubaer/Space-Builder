import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { route } from '@/lib/route';
import webApi from '@/lib/webApi';

type NotificationRow = {
    id: string;
    data: {
        message?: string;
        subject?: string;
        type?: string;
    };
    read_at: string | null;
    created_at: string;
};

export default function NotificationBell() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const { data: countData } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.notifications.unread-count'),
            );

            return response.data as { count: number };
        },
        refetchInterval: 30_000,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['notifications-list'],
        queryFn: async () => {
            const response = await webApi.get(
                route('admin.notifications.list'),
                {
                    params: { per_page: 10 },
                },
            );

            return response.data as {
                data: NotificationRow[];
            };
        },
        enabled: open,
        refetchOnWindowFocus: false,
    });

    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: ['notifications-list'],
        });
        void queryClient.invalidateQueries({
            queryKey: ['notifications-unread-count'],
        });
    };

    const markAllReadMutation = useMutation({
        mutationFn: () =>
            webApi.post(route('admin.notifications.read-all')),
        onSuccess: invalidate,
        onError: () => toast.error('Failed to mark all as read.'),
    });

    const unreadCount = countData?.count ?? 0;
    const notifications = data?.data ?? [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative text-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[10px] leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <CheckCheck className="size-3" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                            Loading…
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                            <Bell className="size-6 opacity-40" />
                            <span>No notifications</span>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const isRead = !!notification.read_at;
                            const message =
                                notification.data?.message ||
                                'Notification';

                            return (
                                <div
                                    key={notification.id}
                                    className={`border-b px-4 py-3 last:border-b-0 ${
                                        isRead ? 'opacity-70' : 'bg-muted/40'
                                    }`}
                                >
                                    <p className="truncate text-sm leading-snug">
                                        {message}
                                    </p>
                                    {notification.data?.subject && (
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {notification.data.subject}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
