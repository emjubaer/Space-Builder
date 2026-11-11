import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { setZiggyConfig } from '@/lib/route';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { Config } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const queryClient = new QueryClient();

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'blogs/preview':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app, { page }) {
        const ziggy = (page?.props as { ziggy?: Config } | undefined)?.ziggy;

        if (ziggy) {
            setZiggyConfig(ziggy);
        }

        router.on('success', (event) => {
            const nextZiggy = (
                event.detail.page.props as { ziggy?: Config }
            ).ziggy;

            if (nextZiggy) {
                setZiggyConfig(nextZiggy);
            }
        });

        return (
            <QueryClientProvider client={queryClient}>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
