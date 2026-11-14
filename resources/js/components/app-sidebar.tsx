import { Link } from '@inertiajs/react';
import {
    Building2,
    Home,
    LayoutGrid,
    Mail,
    MessageSquareQuote,
    Newspaper,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { route } from '@/lib/route';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();

    const rolePermissionActive =
        isCurrentUrl(route('admin.role.index')) ||
        isCurrentUrl(route('admin.permission.index'));

    const postsActive =
        isCurrentUrl(route('admin.blogs.index')) ||
        isCurrentUrl(route('admin.blogs.create')) ||
        /\/admin\/blogs\/\d+\/(edit|preview)/.test(currentUrl);

    const propertiesActive =
        isCurrentUrl(route('admin.properties.index')) ||
        isCurrentUrl(route('admin.properties.create')) ||
        /\/admin\/properties\/\d+\/edit/.test(currentUrl);

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutGrid,
        },
        {
            title: 'User Management',
            href: '#',
            icon: Users,
            items: [
                {
                    title: 'Users',
                    href: route('admin.users.index'),
                },
                {
                    title: 'Role & Permission',
                    href: route('admin.role.index'),
                    isActive: rolePermissionActive,
                },
            ],
        },
    ];

    const websiteNavItems: NavItem[] = [
        {
            title: 'General',
            href: route('admin.website.general.index'),
            icon: Building2,
        },
        {
            title: 'Contact Messages',
            href: route('admin.website.contacts.index'),
            icon: Mail,
        },
        {
            title: 'Testimonials',
            href: route('admin.website.testimonials.index'),
            icon: MessageSquareQuote,
        },
        {
            title: 'Properties',
            href: '#',
            icon: Home,
            items: [
                {
                    title: 'All Properties',
                    href: route('admin.properties.index'),
                    isActive: propertiesActive,
                },
                {
                    title: 'Features',
                    href: route('admin.properties.features.index'),
                },
                {
                    title: 'Types',
                    href: route('admin.properties.types.index'),
                },
                {
                    title: 'Locations',
                    href: route('admin.properties.locations.index'),
                },
            ],
        },
    ];

    const blogNavItems: NavItem[] = [
        {
            title: 'Authors',
            href: route('admin.blogs.authors.index'),
            icon: Users,
        },
        {
            title: 'Blog',
            href: '#',
            icon: Newspaper,
            items: [
                {
                    title: 'Categories',
                    href: route('admin.blogs.categories.index'),
                },
                {
                    title: 'Posts',
                    href: route('admin.blogs.index'),
                    isActive: postsActive,
                },
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Platform" />
                <NavMain items={websiteNavItems} label="Website" />
                <NavMain items={blogNavItems} label="Blog" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
