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
        draft: 'bg-slate-100 text-slate-700 border border-slate-200',
        scheduled: 'bg-amber-100 text-amber-700 border border-amber-200',
        active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        completed: 'bg-blue-100 text-blue-700 border border-blue-200',
        cancelled: 'bg-rose-100 text-rose-700 border border-rose-300',
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
                <div className="rounded-lg bg-white py-4">
                    {surveys.data.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <NotFound
                                title="Survey"
                                pathToCreate={questions.create().url}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm md:p-6">
                                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-slate-500 uppercase">
                                            Survey Workspace
                                        </p>
                                        <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
                                            Manage Survey Questions
                                        </h1>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Search and refine surveys before opening full question details.
                                        </p>
                                    </div>
                                </div>

                                <form action="" className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                Survey
                                            </label>
                                            <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
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
                                            <label className="text-sm font-medium text-slate-700">
                                                Survey Question
                                            </label>
                                            <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
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

                                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                                        <Button variant="outline" className="min-w-24">
                                            Reset
                                        </Button>
                                        <Button className="min-w-24">
                                            <Search className="mr-2 h-4 w-4" />
                                            Search
                                        </Button>
                                        <Link href={questions.create().url}>
                                            <Button className="bg-blue-600 hover:bg-blue-700">
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
                                            className="mb-4 block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
                                                <div className="md:col-span-4">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase">
                                                        Survey title
                                                    </p>
                                                    <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900 md:text-lg">
                                                        {survey.name}
                                                    </h3>
                                                </div>
                                                <div className="md:col-span-4">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase">
                                                        Description
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-sm text-slate-700 md:text-base">
                                                        {survey.description}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase">
                                                        Status
                                                    </p>
                                                    <span
                                                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[survey.status]}`}
                                                    >
                                                        {survey.status}
                                                    </span>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-xs tracking-wide text-slate-500 uppercase">
                                                        Date
                                                    </p>
                                                    <span className="mt-1 block text-sm text-slate-600">
                                                        {format(new Date(survey.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ),
                                )}

                                <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                                    <p className="text-sm text-slate-600">
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
                                                            ? 'border-blue-600 bg-blue-600 text-white'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {cleanPaginationLabel(link.label)}
                                                </Link>
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-400"
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
