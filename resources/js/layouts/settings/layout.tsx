import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const can = useCan();
    const isWebsiteGeneral = isCurrentOrParentUrl(
        route('settings.website-general.index'),
    );

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            href: route('profile.edit'),
            icon: null,
        },
        {
            title: 'Security',
            href: route('security.edit'),
            icon: null,
        },
        {
            title: 'Appearance',
            href: route('appearance.edit'),
            icon: null,
        },
        ...(can('company_profile_view')
            ? [
                  {
                      title: 'General',
                      href: route('settings.website-general.index'),
                      icon: null,
                  } satisfies NavItem,
              ]
            : []),
    ];

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div
                    className={cn(
                        'flex-1',
                        isWebsiteGeneral ? 'md:max-w-4xl' : 'md:max-w-2xl',
                    )}
                >
                    <section
                        className={cn(
                            'space-y-12',
                            isWebsiteGeneral ? 'max-w-4xl' : 'max-w-xl',
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
