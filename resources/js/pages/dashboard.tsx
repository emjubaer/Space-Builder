import { Head, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Construction,
    LayoutDashboard,
    Mail,
    Newspaper,
    Share2,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { route } from '@/lib/route';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

type DashboardStats = {
    properties: number;
    properties_published: number;
    properties_featured: number;
    properties_draft: number;
    properties_upcoming: number;
    properties_ongoing: number;
    properties_completed: number;
    properties_sold_out: number;
    contacts: number;
    contacts_new: number;
    subscribers: number;
    referrals: number;
    referrals_pending: number;
    blogs: number;
    blogs_published: number;
    users: number;
    construction_avg_progress: number;
};

type AnalyticsPoint = {
    date: string;
    properties?: number;
    contacts?: number;
    subscribers?: number;
    referrals?: number;
};

type RecentProperty = {
    id: number;
    title: string;
    status: string;
    is_published: boolean;
    is_featured: boolean;
    updated_at: string | null;
    location?: { id: number; name: string; city?: string | null } | null;
    property_type?: { id: number; name: string } | null;
};

type ConstructionHighlight = {
    id: number;
    title: string;
    status: string;
    progress_percentage: number;
    property?: { id: number; title: string } | null;
};

type RecentContact = {
    id: number;
    full_name: string;
    email: string;
    subject: string | null;
    status: string;
    created_at: string | null;
};

type Props = {
    stats: DashboardStats;
    analytics: {
        series: AnalyticsPoint[];
        seriesKeys: string[];
    };
    recentProperties: RecentProperty[];
    recentContacts: RecentContact[];
    constructionHighlights: ConstructionHighlight[];
};

const SERIES_META: Record<string, { label: string; color: string }> = {
    properties: { label: 'Projects', color: 'var(--chart-1)' },
    contacts: { label: 'Inquiries', color: 'var(--chart-2)' },
    subscribers: { label: 'Subscribers', color: 'var(--chart-3)' },
    referrals: { label: 'Referrals', color: 'var(--chart-4)' },
};

const number = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
        Number(value || 0),
    );

const percent = (value: number) =>
    `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
        Number(value || 0),
    )}%`;

const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });

const formatLongDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

const statusLabel = (status: string) =>
    status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

function KpiCard({
    title,
    value,
    hint,
    icon: Icon,
    tone = 'primary',
}: {
    title: string;
    value: string;
    hint?: string;
    icon: ComponentType<{ className?: string }>;
    tone?: 'primary' | 'chart2' | 'chart3' | 'chart5';
}) {
    const tones = {
        primary: 'from-primary/15 to-transparent text-primary',
        chart2: 'from-chart-2/15 to-transparent text-chart-2',
        chart3: 'from-chart-3/15 to-transparent text-chart-3',
        chart5: 'from-chart-5/15 to-transparent text-chart-5',
    };

    return (
        <Card className="overflow-hidden border-border/70 shadow-none">
            <CardContent className="relative p-5">
                <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${tones[tone]}`}
                />
                <div className="relative flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                            {value}
                        </p>
                        {hint ? (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {hint}
                            </p>
                        ) : null}
                    </div>
                    <div className="rounded-lg border bg-background/80 p-2 shadow-sm">
                        <Icon className="size-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatPill({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <Icon className="size-3.5" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground">
                    {title}
                </p>
                <p className="text-base font-semibold tabular-nums">{value}</p>
            </div>
        </div>
    );
}

export default function Dashboard({
    stats,
    analytics,
    recentProperties,
    recentContacts,
    constructionHighlights,
}: Props) {
    const isMobile = useIsMobile();
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = auth.user?.name?.split(' ')[0] ?? null;
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
              ? 'Good afternoon'
              : 'Good evening';

    const seriesKeys = analytics.seriesKeys ?? [];
    const series = analytics.series ?? [];
    const activityConfig: ChartConfig = Object.fromEntries(
        seriesKeys.map((key) => [
            key,
            {
                label: SERIES_META[key]?.label ?? key,
                color: SERIES_META[key]?.color ?? 'var(--foreground)',
            },
        ]),
    );

    const kpiCards = [
        {
            title: 'Total Projects',
            value: number(stats.properties),
            hint: `${number(stats.properties_featured)} featured`,
            icon: Building2,
            tone: 'primary' as const,
        },
        {
            title: 'Published Listings',
            value: number(stats.properties_published),
            hint: `${number(stats.properties_ongoing)} ongoing`,
            icon: CheckCircle2,
            tone: 'chart2' as const,
        },
        {
            title: 'New Inquiries',
            value: number(stats.contacts_new),
            hint: `${number(stats.contacts)} total messages`,
            icon: Mail,
            tone: 'chart3' as const,
        },
        {
            title: 'Avg Construction',
            value: percent(stats.construction_avg_progress),
            hint: 'Across all project tasks',
            icon: Construction,
            tone: 'chart5' as const,
        },
    ];

    const modulePills = [
        {
            title: 'Projects',
            value: number(stats.properties),
            icon: Building2,
        },
        {
            title: 'Ongoing',
            value: number(stats.properties_ongoing),
            icon: TrendingUp,
        },
        {
            title: 'Completed',
            value: number(stats.properties_completed),
            icon: CheckCircle2,
        },
        {
            title: 'Inquiries',
            value: number(stats.contacts),
            icon: Mail,
        },
        {
            title: 'Subscribers',
            value: number(stats.subscribers),
            icon: UserPlus,
        },
        {
            title: 'Referrals',
            value: number(stats.referrals_pending),
            icon: Share2,
        },
        {
            title: 'Blogs',
            value: number(stats.blogs_published),
            icon: Newspaper,
        },
        {
            title: 'Users',
            value: number(stats.users),
            icon: Users,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden p-4 pb-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            {greeting}
                            {firstName ? `, ${firstName}` : ''}
                        </h1>
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                            Live overview of projects, construction progress,
                            inquiries, and content for your real estate
                            business.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                            {new Date().toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                        <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                            <LayoutDashboard className="size-3.5" />
                            Real estate analytics
                        </div>
                    </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {kpiCards.map((card) =>
                        card.title === 'New Inquiries' ? (
                            <Link
                                key={card.title}
                                href={route('admin.website.contacts.index')}
                                className="block transition-opacity hover:opacity-90"
                            >
                                <KpiCard {...card} />
                            </Link>
                        ) : (
                            <KpiCard key={card.title} {...card} />
                        ),
                    )}
                </section>

                <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                    {modulePills.map((item) => (
                        <StatPill key={item.title} {...item} />
                    ))}
                </section>

                {seriesKeys.length > 0 && series.length > 0 && (
                    <section className="min-w-0">
                        <Card className="min-w-0 overflow-hidden border-border/70 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Activity · last 30 days
                                </CardTitle>
                                <CardDescription>
                                    Daily volume of projects, inquiries,
                                    subscribers, and referrals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="min-w-0 overflow-hidden px-3 sm:px-6">
                                <ChartContainer
                                    config={activityConfig}
                                    className="aspect-auto h-[220px] w-full min-w-0 max-w-full justify-start overflow-hidden sm:h-[280px]"
                                >
                                    <AreaChart
                                        data={series}
                                        margin={{
                                            left: isMobile ? 0 : 8,
                                            right: 4,
                                            top: 8,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            {seriesKeys.map((key) => (
                                                <linearGradient
                                                    key={key}
                                                    id={`fill-${key}`}
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={`var(--color-${key})`}
                                                        stopOpacity={0.35}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={`var(--color-${key})`}
                                                        stopOpacity={0.02}
                                                    />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            minTickGap={isMobile ? 40 : 28}
                                            tickFormatter={formatShortDate}
                                        />
                                        {!isMobile && (
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                width={28}
                                                allowDecimals={false}
                                            />
                                        )}
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) =>
                                                        formatLongDate(
                                                            String(value),
                                                        )
                                                    }
                                                    indicator="dot"
                                                />
                                            }
                                        />
                                        {seriesKeys.map((key) => (
                                            <Area
                                                key={key}
                                                dataKey={key}
                                                type="monotone"
                                                fill={`url(#fill-${key})`}
                                                stroke={`var(--color-${key})`}
                                                strokeWidth={2}
                                                stackId="a"
                                            />
                                        ))}
                                    </AreaChart>
                                </ChartContainer>
                                <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                                    {seriesKeys.map((key) => (
                                        <span
                                            key={key}
                                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                                        >
                                            <span
                                                className="size-2 shrink-0 rounded-[2px]"
                                                style={{
                                                    backgroundColor:
                                                        SERIES_META[key]?.color,
                                                }}
                                            />
                                            {SERIES_META[key]?.label ?? key}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border/70 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Recent projects
                            </CardTitle>
                            <CardDescription>
                                Latest property developments in the pipeline.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentProperties.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No projects yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden sm:table-cell">
                                                Location
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentProperties.map((property) => (
                                            <TableRow key={property.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {property.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {property.property_type
                                                            ?.name ?? '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {statusLabel(
                                                            property.status,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                                                    {property.location?.name ??
                                                        '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-none">
                        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                            <div>
                                <CardTitle className="text-base">
                                    Recent inquiries
                                </CardTitle>
                                <CardDescription>
                                    Latest messages from the contact form.
                                </CardDescription>
                            </div>
                            <Link
                                href={route('admin.website.contacts.index')}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                View all
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentContacts.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No inquiries yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>From</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentContacts.map((contact) => (
                                            <TableRow key={contact.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {contact.full_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {contact.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[10rem] truncate text-sm">
                                                    {contact.subject || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {statusLabel(
                                                            contact.status,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card className="border-border/70 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Construction progress
                            </CardTitle>
                            <CardDescription>
                                Incomplete tasks ranked by completion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {constructionHighlights.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No active construction tasks.
                                </p>
                            ) : (
                                constructionHighlights.map((task) => (
                                    <div key={task.id} className="space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {task.title}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {task.property?.title ??
                                                        'Unassigned project'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                                                {percent(
                                                    task.progress_percentage,
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            task.progress_percentage,
                                                        ),
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
