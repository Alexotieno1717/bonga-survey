import { Head } from '@inertiajs/react';
import NotFound from '@/components/NotFound';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import contact from '@/routes/contact';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contact Creation',
        href: contact.create().url,
    },
];
export default function Create({}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="py-4">
                    <h1 className="text-2xl font-semibold">Create Contact</h1>
                    <p className="text-sm">Enter details to create a contact</p>
                </div>
                <form
                    className="space-y-6"
                    onSubmit={(e) =>{
                        e.preventDefault();
                        console.log("values from form")
                    }}
                >
                    <fieldset className="space-y-4">
                        <Label htmlFor="names">Full Names</Label>
                        <Input
                            name="names"
                            id="names"
                            className="mt-1 block w-full"
                            required
                            autoComplete="names"
                            placeholder="John Doe"
                        />
                    </fieldset>

                    <fieldset className="space-y-4">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            name="phone"
                            id="names"
                            className="mt-1 block w-full"
                            required
                            autoComplete="phone"
                            placeholder="0700 111-222"
                        />
                    </fieldset>

                    <fieldset className="space-y-4">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            name="email"
                            id="names"
                            className="mt-1 block w-full"
                            required
                            autoComplete="email"
                            placeholder="johndoe@example.com"
                        />
                    </fieldset>

                    <fieldset className="space-y-4">
                        <Label htmlFor="gender">Gender</Label>
                        <Select>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="mt-10">
                                <SelectGroup>
                                    <SelectItem value="light">Male</SelectItem>
                                    <SelectItem value="dark">Female</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </fieldset>

                    <fieldset className="space-y-4">
                        <Label htmlFor="groups">Available Contact Groups</Label>
                        <Select>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose contact group" />
                            </SelectTrigger>
                            <SelectContent >
                                <SelectGroup>
                                    <SelectItem value="light">OTM</SelectItem>
                                    <SelectItem value="dark">Test</SelectItem>
                                    <SelectItem value="gray">Gray</SelectItem>
                                    <SelectItem value="Red">Red</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </fieldset>

                    <Button type='submit'>
                        Create Single Contact
                    </Button>
                </form>
            </div>
        </AppLayout>
    )
}
