import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import questions from '@/routes/questions';
import surveysRoutes from '@/routes/surveys';
import type { BreadcrumbItem } from '@/types';

export type SurveyStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface BranchingCondition {
    answer: string | number;
    next_question_id: number | null;
}

export type BranchingLogic = BranchingCondition[];

export interface SurveyFetchProps {
    id: number;
    name: string;
    description: string;
    trigger_word: string;

    invitation_message: string;
    completion_message: string | null;

    branching_logic: BranchingLogic | null;

    start_date: string;
    end_date: string;
    scheduled_time: string;

    status: SurveyStatus;

    created_by: number;
    created_with_ai?: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface SurveysPagination {
    data: SurveyFetchProps[];
    links: PaginationLink[];
    total: number;
    from: number | null;
    to: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Surveys Questions',
        href: questions.index().url,
    },
];

export default function Index() {
    // const surveys = usePage().props.surveys;

    const { surveys } = usePage().props as unknown as {
        surveys: SurveysPagination;
    };

    const statusStyles: Record<SurveyStatus, string> = {
        draft: 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/40 dark:bg-slate-500/25 dark:text-slate-100',
        scheduled: 'border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-100',
        active: 'border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100',
        completed: 'border border-blue-200 bg-blue-100 text-blue-700 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-100',
        cancelled: 'border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/20 dark:text-rose-100',
    };

    const cleanPaginationLabel = (label: string): string => {
        return label
            .replace(/<[^>]*>/g, '')
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .trim();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-lg bg-white py-4 dark:bg-transparent">
                    {surveys.data.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <NotFound
                                title="Survey"
                                pathToCreate={questions.create().url}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm md:p-6 dark:border-slate-500/35 dark:from-slate-900/80 dark:to-slate-800/70 dark:shadow-slate-900/40">
                                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-slate-500 uppercase dark:text-slate-300">
                                            Survey Workspace
                                        </p>
                                        <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-white">
                                            Manage Survey Questions
                                        </h1>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                                            Search and refine surveys before opening full question details.
                                        </p>
                                    </div>
                                </div>

                                <form action="" className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Survey
                                            </label>
                                            <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40">
                                                <option value="">
                                                    Select survey ...
                                                </option>
                                                <option value="1">
                                                    Survey 1
                                                </option>
                                                <option value="2">
                                                    Survey 2
                                                </option>
                                                <option value="3">
                                                    Survey 3
                                                </option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Survey Question
                                            </label>
                                            <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40">
                                                <option value="">
                                                    Select survey question ...
                                                </option>
                                                <option value="1">
                                                    Survey 1
                                                </option>
                                                <option value="2">
                                                    Survey 2
                                                </option>
                                                <option value="3">
                                                    Survey 3
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-500/35">
                                        <Button variant="outline" className="min-w-24">
                                            Reset
                                        </Button>
                                        <Button className="min-w-24">
                                            <Search className="mr-2 h-4 w-4" />
                                            Search
                                        </Button>
                                        <Link href={questions.create().url}>
                                            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">
                                                Create Survey Question
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </div>

                            <div className="py-14">
                                {surveys.data.map(
                                    (
                                        survey: SurveyFetchProps,
                                    ) => (
                                        <Link
                                            href={surveysRoutes.show(survey.id).url}
                                            key={survey.id}
                                            className="mb-4 block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-500/35 dark:bg-slate-900/55 dark:shadow-slate-900/40 dark:hover:bg-slate-800/65"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
                                                <div className="md:col-span-4">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-300">
                                                        Survey title
                                                    </p>
                                                    <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900 md:text-lg dark:text-white">
                                                        {survey.name}
                                                    </h3>
                                                </div>
                                                <div className="md:col-span-4">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-300">
                                                        Description
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-sm text-slate-700 md:text-base dark:text-slate-100">
                                                        {survey.description}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-300">
                                                        Status
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[survey.status]}`}
                                                        >
                                                            {survey.status}
                                                        </span>
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                                survey.created_with_ai
                                                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/35 dark:bg-indigo-500/20 dark:text-indigo-100'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/35 dark:bg-slate-500/25 dark:text-slate-100'
                                                            }`}
                                                        >
                                                            {survey.created_with_ai ? 'AI' : 'Manual'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-300">
                                                        Date
                                                    </p>
                                                    <span className="mt-1 block text-sm text-slate-600 dark:text-slate-100">
                                                        {format(new Date(survey.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ),
                                )}

                                <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between dark:border-slate-500/35">
                                    <p className="text-sm text-slate-600 dark:text-slate-200">
                                        Showing {surveys.from ?? 0} to {surveys.to ?? 0} of {surveys.total} surveys
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {surveys.links.map((link, index) =>
                                            link.url ? (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                                                        link.active
                                                            ? 'border-blue-600 bg-blue-600 text-white dark:border-sky-400 dark:bg-sky-500 dark:text-slate-950'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-500/35 dark:bg-slate-900/65 dark:text-slate-100 dark:hover:bg-slate-800/75'
                                                    }`}
                                                >
                                                    {cleanPaginationLabel(link.label)}
                                                </Link>
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-400 dark:border-slate-500/25 dark:bg-slate-800/40 dark:text-slate-500"
                                                >
                                                    {cleanPaginationLabel(link.label)}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
