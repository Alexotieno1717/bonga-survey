import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    const childActive =
                        item.children?.some((child) =>
                            isCurrentUrl(child.href)
                        ) ?? false;

                    return (
                        <SidebarMenuItem key={item.title}>
                            {item.children ? (
                                <details
                                    className="group"
                                    open={childActive}
                                >
                                    <summary
                                        className={`flex items-center gap-2 ml-2 py-2 cursor-pointer ${
                                            childActive ? 'text-primary font-semibold' : ''
                                        }`}
                                    >
                                        {item.icon && (
                                            <item.icon className="w-4 h-4" />
                                        )}
                                        {item.title}
                                    </summary>

                                    <div className="ml-6 mt-2 space-y-2">
                                        {item.children.map((child) => (
                                            <SidebarMenuButton
                                                key={child.title}
                                                asChild
                                                isActive={isCurrentUrl(child.href)}
                                            >
                                                <Link href={child.href!}>
                                                    {child.icon && (
                                                        <child.icon className="w-4 h-4" />
                                                    )}
                                                    <span>{child.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        ))}
                                    </div>
                                </details>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                >
                                    <Link href={item.href!}>
                                        {item.icon && (
                                            <item.icon className="w-4 h-4" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
