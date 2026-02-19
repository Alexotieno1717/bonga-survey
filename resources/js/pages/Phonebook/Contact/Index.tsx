import { Head, Link, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import contact from '@/routes/contact';
import type { BreadcrumbItem } from '@/types';

interface ContactProps {
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
    const { contacts } = usePage().props as unknown as {
        contacts: ContactProps[];
    };

    const columns: ColumnDef<ContactProps>[] = [
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

                {contacts.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <NotFound title="contact" pathToCreate={contact.create().url} />
                    </div>

                ) : (
                    <div className="py-2">
                        {/* HEADER */}
                        <div className="flex justify-between">
                            <h1 className="text-3xl leading-10 font-semibold">
                                Manage Contacts
                            </h1>
                        </div>

                        <div className="px-6 pb-6 border-b border-gray-200">
                            <div className="flex items-end justify-end pt-[17px] space-x-3">
                                <Link
                                    href={contact.create().url}
                                    as="button"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring h-9 px-4 py-2 has-[>svg]:px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer"
                                >
                                    Create Single contact
                                </Link>
                                <Button>Import contact</Button>
                            </div>
                        </div>

                        <DataTable<ContactProps> columns={columns} data={contacts} filterColumn="names" />
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
