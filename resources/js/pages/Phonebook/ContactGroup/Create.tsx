import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import contactgroup from '@/routes/contactgroup';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Group Creation',
        href: route('contactgroup.create'),
    },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        status: 'active',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Contact Group" />
            <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold">Create Contact Group</h1>
                    <p className="pb-6 text-sm text-slate-600">Create a group to organize contacts.</p>

                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post(route('contactgroup.store'), {
                                onSuccess: () => {
                                    toast.success('Contact group created successfully.');
                                },
                                onError: () => {
                                    toast.error('Failed to create contact group.');
                                },
                            });
                        }}
                    >
                        <fieldset className="space-y-2">
                            <Label htmlFor="name">Group Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                placeholder="Team Alpha"
                            />
                            {errors.name ? <p className="text-sm text-red-500">{errors.name}</p> : null}
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
                            <Link href={contactgroup.index().url}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Contact Group'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
