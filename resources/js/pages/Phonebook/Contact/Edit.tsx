import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import contact from '@/routes/contact';
import type { BreadcrumbItem } from '@/types';

interface ContactGroupOption {
    id: number;
    name: string;
}

interface ContactPayload {
    id: number;
    names: string;
    phone: string;
    email: string | null;
    gender: 'male' | 'female' | null;
    contact_group_id: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Edit Contact',
        href: contact.index().url,
    },
];

export default function Edit() {
    const { contact: contactData, contactGroups } = usePage().props as unknown as {
        contact: ContactPayload;
        contactGroups: ContactGroupOption[];
    };

    const { data, setData, put, processing, errors } = useForm({
        names: contactData.names,
        phone: contactData.phone,
        email: contactData.email ?? '',
        gender: contactData.gender ?? '',
        contact_group_id: contactData.contact_group_id ? String(contactData.contact_group_id) : '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Contact" />
            <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="pb-6">
                        <h1 className="text-2xl font-semibold">Edit Contact</h1>
                        <p className="text-sm text-slate-600">
                            Update details for this contact.
                        </p>
                    </div>

                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            put(route('contact.update', contactData.id), {
                                onSuccess: () => {
                                    toast.success('Contact updated successfully.');
                                },
                                onError: () => {
                                    toast.error('Failed to update contact. Please check the form.');
                                },
                            });
                        }}
                    >
                        <fieldset className="space-y-2">
                            <Label htmlFor="names">Full Names</Label>
                            <Input
                                name="names"
                                id="names"
                                className="mt-1 block w-full"
                                required
                                autoComplete="name"
                                placeholder="John Doe"
                                value={data.names}
                                onChange={(event) => setData('names', event.target.value)}
                            />
                            {errors.names ? <p className="text-sm text-red-500">{errors.names}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                name="phone"
                                id="phone"
                                className="mt-1 block w-full"
                                required
                                autoComplete="tel"
                                placeholder="0700 111 222"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                            />
                            {errors.phone ? <p className="text-sm text-red-500">{errors.phone}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                name="email"
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                autoComplete="email"
                                placeholder="johndoe@example.com"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                            />
                            {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <select
                                id="gender"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.gender}
                                onChange={(event) => setData('gender', event.target.value)}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            {errors.gender ? <p className="text-sm text-red-500">{errors.gender}</p> : null}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="contact_group_id">Available Contact Groups</Label>
                            <select
                                id="contact_group_id"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.contact_group_id}
                                onChange={(event) => setData('contact_group_id', event.target.value)}
                            >
                                <option value="">Choose contact group</option>
                                {contactGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            {errors.contact_group_id ? <p className="text-sm text-red-500">{errors.contact_group_id}</p> : null}
                        </fieldset>

                        <div className="flex items-center justify-end gap-2">
                            <Link href={contact.index().url}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Contact'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
