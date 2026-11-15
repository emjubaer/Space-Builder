import { useMutation } from '@tanstack/react-query';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

export type ReferralReward = {
    id: number;
    amount: string | number;
    status: string;
    earned_at: string | null;
};

export type ReferralRow = {
    id: number;
    referred_name: string;
    referred_phone: string | null;
    note: string | null;
    permission_confirmed: boolean;
    status: string;
    source: string;
    submitted_at: string;
    converted_at: string | null;
    referrer?: {
        id: number;
        name: string | null;
        email: string;
        mobile: string | null;
    } | null;
    reward?: ReferralReward | null;
};

export type ReferralGroup = {
    referrer: {
        id: number;
        name: string | null;
        email: string;
        mobile: string | null;
    };
    referrals_count: number;
    verified_count: number;
    referrals: ReferralRow[];
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    groups: ReferralGroup[];
    statuses: StatusOption[];
    onChanged: () => void;
};

const statusVariant = (status: string) => {
    switch (status) {
        case 'verified':
            return 'default' as const;
        case 'unverified':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

const initials = (name: string | null, email: string) => {
    const source = (name || email).trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase() || '?';
};

export default function ReferralsTable({
    groups,
    statuses,
    onChanged,
}: Props) {
    const [selected, setSelected] = useState<ReferralRow | null>(null);
    const [statusValue, setStatusValue] = useState('unverified');
    const [rewardAmount, setRewardAmount] = useState('');

    const openSheet = (
        referral: ReferralRow,
        referrer: ReferralGroup['referrer'],
    ) => {
        setSelected({ ...referral, referrer });
        setStatusValue(referral.status);
        setRewardAmount(
            referral.reward?.amount !== undefined &&
                referral.reward?.amount !== null
                ? String(referral.reward.amount)
                : '',
        );
    };

    const statusMutation = useMutation({
        mutationFn: ({
            status,
            reward_amount,
        }: {
            status: string;
            reward_amount?: string;
        }) =>
            webApi.put(route('admin.referrals.status', selected!.id), {
                status,
                ...(reward_amount !== undefined
                    ? { reward_amount }
                    : {}),
            }),
        onSuccess: (response) => {
            toast.success(response.data.message || 'Status updated.');
            const referral = response.data.referral as ReferralRow;
            setSelected(referral);
            setStatusValue(referral.status);
            setRewardAmount(
                referral.reward?.amount !== undefined &&
                    referral.reward?.amount !== null
                    ? String(referral.reward.amount)
                    : '',
            );
            onChanged();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error.response?.data?.message || 'Failed to update status.',
            );
        },
    });

    if (groups.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No referrals found.
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {groups.map((group) => (
                    <Collapsible
                        key={group.referrer.id}
                        className="group/referrer overflow-hidden rounded-xl border bg-card"
                    >
                        <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40">
                            <Avatar className="size-10 border">
                                <AvatarFallback className="bg-muted text-xs font-medium">
                                    {initials(
                                        group.referrer.name,
                                        group.referrer.email,
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-medium">
                                        {group.referrer.name ||
                                            group.referrer.email}
                                    </p>
                                    <Badge variant="secondary">
                                        {group.referrals_count}{' '}
                                        {group.referrals_count === 1
                                            ? 'referral'
                                            : 'referrals'}
                                    </Badge>
                                    {group.verified_count > 0 ? (
                                        <Badge variant="outline">
                                            {group.verified_count} verified
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {[
                                        group.referrer.email,
                                        group.referrer.mobile,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </div>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/referrer:rotate-90" />
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                            <div className="border-t bg-muted/20">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>
                                                    Referred person
                                                </TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Source</TableHead>
                                                <TableHead>Reward</TableHead>
                                                <TableHead>Note</TableHead>
                                                <TableHead className="w-12">
                                                    Action
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.referrals.map((referral) => (
                                                <TableRow key={referral.id}>
                                                    <TableCell className="font-medium">
                                                        {referral.referred_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {referral.referred_phone ||
                                                            '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {new Date(
                                                            referral.submitted_at,
                                                        ).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={statusVariant(
                                                                referral.status,
                                                            )}
                                                        >
                                                            {formatStatus(
                                                                referral.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatStatus(
                                                            referral.source ||
                                                                'manual',
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {referral.reward
                                                            ?.amount !==
                                                            undefined &&
                                                        referral.reward
                                                            ?.amount !== null
                                                            ? referral.reward
                                                                  .amount
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="max-w-[12rem] truncate">
                                                        {referral.note || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="rounded p-2 hover:bg-muted focus:outline-none"
                                                                    aria-label="Actions"
                                                                >
                                                                    <MoreHorizontal
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        openSheet(
                                                                            referral,
                                                                            group.referrer,
                                                                        )
                                                                    }
                                                                >
                                                                    View /
                                                                    Verify
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>

            <Sheet
                open={selected !== null}
                onOpenChange={(next) => {
                    if (!next) {
                        setSelected(null);
                    }
                }}
            >
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>{selected?.referred_name}</SheetTitle>
                        <SheetDescription>
                            Referred by{' '}
                            {selected?.referrer?.name ||
                                selected?.referrer?.email ||
                                'unknown'}
                        </SheetDescription>
                    </SheetHeader>

                    {selected ? (
                        <div className="mt-6 grid gap-5 px-4 pb-6">
                            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                                <div className="grid gap-1 text-sm">
                                    <p className="text-muted-foreground">
                                        Phone
                                    </p>
                                    <p className="font-medium">
                                        {selected.referred_phone || '—'}
                                    </p>
                                </div>
                                <div className="grid gap-1 text-sm">
                                    <p className="text-muted-foreground">
                                        Source
                                    </p>
                                    <p className="font-medium">
                                        {formatStatus(
                                            selected.source || 'manual',
                                        )}
                                    </p>
                                </div>
                                <div className="grid gap-1 text-sm sm:col-span-2">
                                    <p className="text-muted-foreground">
                                        Submitted
                                    </p>
                                    <p className="font-medium">
                                        {new Date(
                                            selected.submitted_at,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div className="grid gap-1 text-sm sm:col-span-2">
                                    <p className="text-muted-foreground">
                                        Note
                                    </p>
                                    <p className="whitespace-pre-wrap rounded-md border bg-background p-3 text-sm">
                                        {selected.note || '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="referral-status">Status</Label>
                                <Select
                                    value={statusValue}
                                    onValueChange={setStatusValue}
                                >
                                    <SelectTrigger
                                        id="referral-status"
                                        className="w-full"
                                    >
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
                                <Label htmlFor="referral-reward">
                                    Reward amount{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="referral-reward"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 500"
                                    value={rewardAmount}
                                    onChange={(event) =>
                                        setRewardAmount(event.target.value)
                                    }
                                />
                                {selected.reward?.status ? (
                                    <p className="text-xs text-muted-foreground">
                                        Current reward status:{' '}
                                        {formatStatus(selected.reward.status)}
                                    </p>
                                ) : null}
                            </div>

                            <Button
                                type="button"
                                className="w-full"
                                disabled={statusMutation.isPending}
                                onClick={() => {
                                    const trimmed = rewardAmount.trim();
                                    statusMutation.mutate({
                                        status: statusValue,
                                        ...(trimmed !== ''
                                            ? { reward_amount: trimmed }
                                            : {}),
                                    });
                                }}
                            >
                                {statusMutation.isPending
                                    ? 'Updating...'
                                    : 'Update'}
                            </Button>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </>
    );
}
