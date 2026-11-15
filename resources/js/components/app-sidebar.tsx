import { Link } from '@inertiajs/react';
import {
    Gift,
    Home,
    LayoutGrid,
    Mail,
    MessageSquareQuote,
    Newspaper,
    UserPlus,
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
import { useCan, useCanAny } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { route } from '@/lib/route';
import type { NavItem } from '@/types';

function filterNavItems(items: NavItem[]): NavItem[] {
    return items
        .map((item) => {
            if (item.items?.length) {
                const children = filterNavItems(item.items);

                if (children.length === 0) {
                    return null;
                }

                return { ...item, items: children };
            }

            return item;
        })
        .filter((item): item is NavItem => item !== null);
}

export function AppSidebar() {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();
    const can = useCan();
    const canAny = useCanAny();

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

    const mainNavItems: NavItem[] = filterNavItems([
        ...(can('dashboard_view')
            ? [
                  {
                      title: 'Dashboard',
                      href: route('dashboard'),
                      icon: LayoutGrid,
                  } satisfies NavItem,
              ]
            : []),
        ...(canAny(['user_view', 'role_view', 'permission_view'])
            ? [
                  {
                      title: 'User Management',
                      href: '#',
                      icon: Users,
                      items: [
                          ...(can('user_view')
                              ? [
                                    {
                                        title: 'Users',
                                        href: route('admin.users.index'),
                                    } satisfies NavItem,
                                ]
                              : []),
                          ...(canAny(['role_view', 'permission_view'])
                              ? [
                                    {
                                        title: 'Role & Permission',
                                        href: route('admin.role.index'),
                                        isActive: rolePermissionActive,
                                    } satisfies NavItem,
                                ]
                              : []),
                      ],
                  } satisfies NavItem,
              ]
            : []),
    ]);

    const websiteNavItems: NavItem[] = filterNavItems([
        ...(can('referral_view')
            ? [
                  {
                      title: 'Referrals',
                      href: route('admin.referrals.index'),
                      icon: Gift,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('contact_view')
            ? [
                  {
                      title: 'Contact Messages',
                      href: route('admin.website.contacts.index'),
                      icon: Mail,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('newsletter_view')
            ? [
                  {
                      title: 'Newsletter',
                      href: route('admin.website.newsletter.index'),
                      icon: UserPlus,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('testimonial_view')
            ? [
                  {
                      title: 'Testimonials',
                      href: route('admin.website.testimonials.index'),
                      icon: MessageSquareQuote,
                  } satisfies NavItem,
              ]
            : []),
        ...(canAny([
            'property_view',
            'property_feature_view',
            'property_type_view',
            'location_view',
        ])
            ? [
                  {
                      title: 'Properties',
                      href: '#',
                      icon: Home,
                      items: [
                          ...(can('property_view')
                              ? [
                                    {
                                        title: 'All Properties',
                                        href: route('admin.properties.index'),
                                        isActive: propertiesActive,
                                    } satisfies NavItem,
                                ]
                              : []),
                          ...(can('property_feature_view')
                              ? [
                                    {
                                        title: 'Features',
                                        href: route(
                                            'admin.properties.features.index',
                                        ),
                                    } satisfies NavItem,
                                ]
                              : []),
                          ...(can('property_type_view')
                              ? [
                                    {
                                        title: 'Types',
                                        href: route(
                                            'admin.properties.types.index',
                                        ),
                                    } satisfies NavItem,
                                ]
                              : []),
                          ...(can('location_view')
                              ? [
                                    {
                                        title: 'Locations',
                                        href: route(
                                            'admin.properties.locations.index',
                                        ),
                                    } satisfies NavItem,
                                ]
                              : []),
                      ],
                  } satisfies NavItem,
              ]
            : []),
    ]);

    const blogNavItems: NavItem[] = filterNavItems([
        ...(can('blog_author_view')
            ? [
                  {
                      title: 'Authors',
                      href: route('admin.blogs.authors.index'),
                      icon: Users,
                  } satisfies NavItem,
              ]
            : []),
        ...(canAny([
            'blog_view',
            'blog_category_create',
            'blog_category_update',
            'blog_category_delete',
        ])
            ? [
                  {
                      title: 'Blog',
                      href: '#',
                      icon: Newspaper,
                      items: [
                          ...(canAny([
                              'blog_category_create',
                              'blog_category_update',
                              'blog_category_delete',
                          ])
                              ? [
                                    {
                                        title: 'Categories',
                                        href: route(
                                            'admin.blogs.categories.index',
                                        ),
                                    } satisfies NavItem,
                                ]
                              : []),
                          ...(can('blog_view')
                              ? [
                                    {
                                        title: 'Posts',
                                        href: route('admin.blogs.index'),
                                        isActive: postsActive,
                                    } satisfies NavItem,
                                ]
                              : []),
                      ],
                  } satisfies NavItem,
              ]
            : []),
    ]);

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
                {mainNavItems.length > 0 && (
                    <NavMain items={mainNavItems} label="Platform" />
                )}
                {websiteNavItems.length > 0 && (
                    <NavMain items={websiteNavItems} label="Website" />
                )}
                {blogNavItems.length > 0 && (
                    <NavMain items={blogNavItems} label="Blog" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
