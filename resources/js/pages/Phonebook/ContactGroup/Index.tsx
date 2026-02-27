import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { DataTable } from '@/components/DataTable';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import contactgroup from '@/routes/contactgroup';
import type { BreadcrumbItem } from '@/types';

interface ContactGroupProps {
    id: number;
    name: string;
    status: string;
    user?: {
        id: number;
        name: string;
    };
}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Groups',
        href: contactgroup.index().url,
    },
];
export default function Index() {

    const { contactgroups } = usePage().props as unknown as {
        contactgroups: ContactGroupProps[];
    };
    const [contactGroupIdToDelete, setContactGroupIdToDelete] = useState<number | null>(null);

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
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link
                        href={route('contactgroup.edit', row.original.id)}
                        className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                        type="button"
                        className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        onClick={() => {
                            setContactGroupIdToDelete(row.original.id);
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

                {contactgroups.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <NotFound title="contact group" pathToCreate={route('contactgroup.create')} />
                    </div>

                ) : (
                    <>
                        {/* HEADER */}
                        <div className="flex justify-between">
                            <h1 className="text-3xl leading-10 font-semibold">
                                Manage Contact Groups
                            </h1>
                            <Link href={route('contactgroup.create')}>
                                <Button>Create Contact Group</Button>
                            </Link>
                        </div>

                        <div className="py-2">
                            <DataTable<ContactGroupProps> columns={columns} data={contactgroups} filterColumn="name" />
                        </div>
                        <DeleteConfirmationDialog
                            isOpen={contactGroupIdToDelete !== null}
                            title="Delete Contact Group"
                            description="Are you sure you want to delete this contact group? This action cannot be undone."
                            onConfirm={() => {
                                if (contactGroupIdToDelete !== null) {
                                    router.delete(route('contactgroup.destroy', contactGroupIdToDelete));
                                }
                                setContactGroupIdToDelete(null);
                            }}
                            onCancel={() => {
                                setContactGroupIdToDelete(null);
                            }}
                        />
                    </>

                )}
            </div>
        </AppLayout>
    )
}
