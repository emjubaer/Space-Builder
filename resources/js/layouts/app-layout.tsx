import { Head, usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { branding } = usePage().props;
    const faviconUrl = branding?.favicon_url ?? null;

    return (
        <>
            <Head>
                {faviconUrl ? (
                    <>
                        <link rel="icon" href={faviconUrl} />
                        <link rel="apple-touch-icon" href={faviconUrl} />
                    </>
                ) : (
                    <>
                        <link rel="icon" href="/favicon.ico" sizes="any" />
                        <link
                            rel="icon"
                            href="/favicon.svg"
                            type="image/svg+xml"
                        />
                        <link
                            rel="apple-touch-icon"
                            href="/apple-touch-icon.png"
                        />
                    </>
                )}
            </Head>
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                {children}
            </AppLayoutTemplate>
        </>
    );
}
