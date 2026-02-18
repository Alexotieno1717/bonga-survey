import { Link } from '@inertiajs/react';
import {
    BookOpen,
    BookUser,
    Brain,
    FileText,
    Folder,
    LayoutGrid,
    ListTodo,
    MapPin,
    MessageSquare,
    User,
    User2,
    Users,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
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
import { dashboard } from '@/routes';
import questions from '@/routes/questions';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import contact from '@/routes/contact';
import contactgroup from '@/routes/contactgroup';
import contactgroupmaps from '@/routes/contactgroupmaps';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Survey',
        href: '',
        icon: ListTodo,
        children: [
            {
                title: 'Survey Questions',
                href: questions.index(),
                icon: FileText,
            },
            {
                title: 'AI Survey',
                href: '/surveys/ai',
                icon: Brain,
            },
            {
                title: 'Survey Responses',
                href: '/surveys/responses',
                icon: MessageSquare,
            },
        ],
    },
    {
        title: 'Phonebook',
        href: '',
        icon: BookUser,
        children: [
            {
                title: 'Contacts',
                href: contact.index(),
                icon: Users,
            },
            {
                title: 'Contact Groups',
                href: contactgroup.index(),
                icon: User,
            },
            {
                title: 'Contact Group Maps',
                href: contactgroupmaps.index(),
                icon: MapPin,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
