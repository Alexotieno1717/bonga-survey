import { Head, Link, usePage } from '@inertiajs/react';
import contact from '@/routes/contact';
import NotFound from '@/components/NotFound';
import { DataTable } from '@/components/DataTable';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import contactgroup from '@/routes/contactgroup';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

interface ContactGroupProps {
    id: number
    name: string
    status: string
    user: {
        id: number
        name: string
    }
}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Groups',
        href: contactgroup.index().url,
    },
];
export default function Index() {

    const { contactgroups } = usePage().props as { contactgroups: ContactGroupProps [] };

    const columns: ColumnDef<ContactGroupProps>[] = [
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
            accessorKey: "name",
            header: "Names",
        },
        {
            header: "Client",
            cell: ({ row }) => row.original.user?.name,
        },

        {
            accessorKey: "status",
            header: "Status",
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {contactgroups.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <NotFound title="contact" pathToCreate={contact.create().url} />
                    </div>

                ) : (
                    <>
                        {/* HEADER */}
                        <div className="flex justify-between">
                            <h1 className="text-3xl leading-10 font-semibold">
                                Manage Contact Groups
                            </h1>
                        </div>

                        <div className="py-2">
                            <DataTable<ContactGroupProps, any> columns={columns} data={contactgroups} filterColumn="name" />
                        </div>
                    </>

                )}
            </div>
        </AppLayout>
    )
}
