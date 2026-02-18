import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import NotFound from '@/components/NotFound';
import contact from '@/routes/contact';
import { DataTable } from '@/components/DataTable';
import type { BreadcrumbItem } from '@/types';
import contactgroupmaps from '@/routes/contactgroupmaps';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

interface ContactGroupMapProps {
    group: string;
    phone: string;
    status: string;
    created_at: string;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Groups',
        href: contactgroupmaps.index().url,
    },
];
export default function Index() {

    const { contactgroupmaps } = usePage().props as { contactgroupmaps: ContactGroupMapProps[] };

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
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {contactgroupmaps.length === 0 ? (
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
                            <DataTable<ContactGroupMapProps, any> columns={columns} data={contactgroupmaps} filterColumn="group" />
                        </div>
                    </>

                )}
            </div>
        </AppLayout>

    )
}
