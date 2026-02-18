import { Head, Link, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import contact from '@/routes/contact';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

interface Contact {
    id: number;
    names: string;
    email: string;
    phone: string;
    gender: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contacts',
        href: contact.index().url,
    },
];
export default function Index() {
    const { contacts } = usePage().props as { contacts: Contact [] };

    const columns: ColumnDef<Contact>[] = [
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
            accessorKey: "names",
            header: "Names",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "gender",
            header: "Gender",
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* HEADER */}
                <div className="flex justify-between">
                    <h1 className="text-3xl leading-10 font-semibold">
                        Manage Survey Questions
                    </h1>
                </div>

                <div className="px-6 pb-6 border-b border-gray-200">
                    <div className="flex items-end justify-end pt-[17px] space-x-3">
                        <Link href={contact.create().url} as="button">
                            <Button
                                variant="outline"
                                className="cursor-pointer"
                            >
                                Create Single contact
                            </Button>
                        </Link>
                        <Button>Import contact</Button>
                    </div>
                </div>


                {contacts.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <NotFound title="contact" pathToCreate={contact.create().url} />
                    </div>

                ) : (
                    <div className="py-2">
                        <DataTable columns={columns} data={contacts} />
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
