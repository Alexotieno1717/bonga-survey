import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import contactgroupmaps from '@/routes/contactgroupmaps';
import type { BreadcrumbItem } from '@/types';

interface ContactOption {
    id: number;
    names: string;
    phone: string;
}

interface ContactGroupOption {
    id: number;
    name: string;
}

interface ContactGroupMapPayload {
    id: number;
    contact_id: number;
    contact_group_id: number;
    status: 'active' | 'inactive';
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Edit Contact Group Map',
        href: contactgroupmaps.index().url,
    },
];

export default function Edit() {
    const { contactGroupMap, contacts, contactGroups } = usePage().props as unknown as {
        contactGroupMap: ContactGroupMapPayload;
        contacts: ContactOption[];
        contactGroups: ContactGroupOption[];
    };

    const { data, setData, put, processing, errors } = useForm({
        contact_id: String(contactGroupMap.contact_id),
        contact_group_id: String(contactGroupMap.contact_group_id),
        status: contactGroupMap.status,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Contact Group Map" />
            <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold">Edit Contact Group Map</h1>
                    <p className="pb-6 text-sm text-slate-600">Update this contact assignment.</p>

                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            put(route('contactgroupmaps.update', contactGroupMap.id), {
                                onSuccess: () => {
                                    toast.success('Contact group map updated successfully.');
                                },
                                onError: () => {
                                    toast.error('Failed to update contact group map.');
                                },
                            });
                        }}
                    >
                        <fieldset className="space-y-2">
                            <Label htmlFor="contact_id">Contact</Label>
                            <select
                                id="contact_id"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.contact_id}
                                onChange={(event) => setData('contact_id', event.target.value)}
                            >
                                <option value="">Select contact</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.names} ({contact.phone})
                                    </option>
                                ))}
                            </select>
                            {errors.contact_id ? <p className="text-sm text-red-500">{errors.contact_id}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="contact_group_id">Contact Group</Label>
                            <select
                                id="contact_group_id"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.contact_group_id}
                                onChange={(event) => setData('contact_group_id', event.target.value)}
                            >
                                <option value="">Select group</option>
                                {contactGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            {errors.contact_group_id ? <p className="text-sm text-red-500">{errors.contact_group_id}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value as 'active' | 'inactive')}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {errors.status ? <p className="text-sm text-red-500">{errors.status}</p> : null}
                        </fieldset>

                        <div className="flex justify-end gap-2">
                            <Link href={contactgroupmaps.index().url}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Mapping'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
