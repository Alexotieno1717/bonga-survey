import { Head, Link } from '@inertiajs/react';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import questions from '@/routes/questions';
import type { BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Surveys Questions',
        href: questions.index().url,
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* HEADER */}
                <div className="flex justify-between">
                    <h1 className="text-3xl leading-10 font-semibold">
                        Manage Survey Questions
                    </h1>
                </div>

                <div className="rounded-lg bg-white py-4">
                    <div className="px-6">
                        <form action="">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-[6px]">
                                    <label className="text text-sm">
                                        Survey
                                    </label>
                                    <select className="placeholder-text-muted-foreground h-10 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">
                                            Select survey ...
                                        </option>
                                        <option value="1">Survey 1</option>
                                        <option value="2">Survey 2</option>
                                        <option value="3">Survey 3</option>
                                    </select>
                                </div>

                                <div className="space-y-[6px]">
                                    <label className="text text-sm">
                                        Survey Question
                                    </label>
                                    <select className="placeholder-text-muted-foreground h-10 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">
                                            Select survey question ...
                                        </option>
                                        <option value="1">Survey 1</option>
                                        <option value="2">Survey 2</option>
                                        <option value="3">Survey 3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-end justify-end space-x-3 pt-[17px]">
                                <Button variant='outline'>Reset</Button>
                                <Button>Search</Button>
                                <Link href={questions.create().url}>
                                    <Button>Create Survey Question</Button>
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="mt-6">
                        <NotFound
                            title={'Survey Question'}
                            pathToCreate={questions.create().url}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
