import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

export type ComboboxUser = {
    id: number;
    name: string | null;
    email: string;
    avatar?: string | null;
};

type Props = {
    value: number | null;
    selectedUser?: ComboboxUser | null;
    users: ComboboxUser[];
    loading?: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    onChange: (user: ComboboxUser | null) => void;
    placeholder?: string;
};

export default function UserCombobox({
    value,
    selectedUser = null,
    users,
    loading = false,
    search,
    onSearchChange,
    onChange,
    placeholder = 'Search users…',
}: Props) {
    const [open, setOpen] = useState(false);
    const getInitials = useInitials();

    const selected = useMemo(() => {
        return users.find((user) => user.id === value) || selectedUser;
    }, [users, value, selectedUser]);

    useEffect(() => {
        if (!open) {
            return;
        }
        onSearchChange(search);
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-auto w-full justify-between py-2 font-normal"
                >
                    {selected ? (
                        <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar className="size-7 shrink-0">
                                <AvatarImage
                                    src={selected.avatar ?? undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                    {getInitials(selected.name || selected.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col text-left">
                                <span className="truncate text-sm font-medium leading-tight">
                                    {selected.name || selected.email}
                                </span>
                                <span className="truncate text-xs leading-tight text-muted-foreground">
                                    {selected.email}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
            >
                <div className="border-b p-2">
                    <Input
                        placeholder="Type name or email…"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        autoFocus
                    />
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading…
                        </div>
                    )}
                    {!loading && users.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No users found.
                        </div>
                    )}
                    {!loading &&
                        users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-muted"
                                onClick={() => {
                                    onChange(user);
                                    setOpen(false);
                                }}
                            >
                                <Avatar className="size-7 shrink-0">
                                    <AvatarImage
                                        src={user.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                        {getInitials(user.name || user.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium leading-tight">
                                        {user.name || user.email}
                                    </div>
                                    <div className="truncate text-xs leading-tight text-muted-foreground">
                                        {user.email}
                                    </div>
                                </div>
                                <Check
                                    className={cn(
                                        'size-4 shrink-0',
                                        value === user.id
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                            </button>
                        ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
