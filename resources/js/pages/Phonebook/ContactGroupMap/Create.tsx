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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Group Map Creation',
        href: route('contactgroupmaps.create'),
    },
];

export default function Create() {
    const { contacts, contactGroups } = usePage().props as unknown as {
        contacts: ContactOption[];
        contactGroups: ContactGroupOption[];
    };

    const { data, setData, post, processing, errors } = useForm({
        contact_id: '',
        contact_group_id: '',
        status: 'active',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Contact Group Map" />
            <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold">Create Contact Group Map</h1>
                    <p className="pb-6 text-sm text-slate-600">Assign a contact to a group.</p>

                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post(route('contactgroupmaps.store'), {
                                onSuccess: () => {
                                    toast.success('Contact group map created successfully.');
                                },
                                onError: () => {
                                    toast.error('Failed to create contact group map.');
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
                                onChange={(event) => setData('status', event.target.value)}
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
                                {processing ? 'Creating...' : 'Create Mapping'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
