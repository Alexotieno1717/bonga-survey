import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/DataTable';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import contactgroupmaps from '@/routes/contactgroupmaps';
import type { BreadcrumbItem } from '@/types';

interface ContactGroupMapProps {
    id: number;
    group: string;
    phone: string;
    status: string;
    created_at: string;
    contact: {
        id: number;
        names: string;
        phone: string;
    };
    contact_group: {
        id: number;
        name: string;
    };
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Groups',
        href: contactgroupmaps.index().url,
    },
];
export default function Index() {

    const { contactgroupmaps } = usePage().props as unknown as {
        contactgroupmaps: ContactGroupMapProps[];
    };

    const columns: ColumnDef<ContactGroupMapProps>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "group",
            header: "Group",
        },
        {
            header: "Contact",
            cell: ({ row }) => row.original.contact?.names,
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "status",
            header: "Status",
        },
        {
            accessorKey: "created_at",
            header: "Created at",
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link
                        href={route('contactgroupmaps.edit', row.original.id)}
                        className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                        type="button"
                        className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        onClick={() => {
                            if (!confirm('Delete this contact group map?')) {
                                return;
                            }

                            router.delete(route('contactgroupmaps.destroy', row.original.id));
                        }}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {contactgroupmaps.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <NotFound title="contact group map" pathToCreate={route('contactgroupmaps.create')} />
                    </div>

                ) : (
                    <>
                        {/* HEADER */}
                        <div className="flex justify-between">
                            <h1 className="text-3xl leading-10 font-semibold">
                                Manage Contact Groups
                            </h1>
                            <Link href={route('contactgroupmaps.create')}>
                                <Button>Create Contact Group Map</Button>
                            </Link>
                        </div>

                        <div className="py-2">
                            <DataTable<ContactGroupMapProps> columns={columns} data={contactgroupmaps} filterColumn="group" />
                        </div>
                    </>

                )}
            </div>
        </AppLayout>

    )
}
