import { Head, Link, usePage } from '@inertiajs/react';
import { PencilIcon, TrashIcon } from 'lucide-react';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import contact from '@/routes/contact';
import questions from '@/routes/questions';
import type { BreadcrumbItem } from '@/types';


export type SurveyStatus = 'draft' | 'scheduled' | 'active' | 'completed';

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


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Surveys Questions',
        href: questions.index().url,
    },
];

export default function Index() {

    // const surveys = usePage().props.surveys;

    const { surveys } = usePage().props as unknown as {
        surveys: SurveyFetchProps[];
    };

    console.log(surveys);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-lg bg-white py-4">
                    {surveys.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <NotFound
                                title="contact"
                                pathToCreate={contact.create().url}
                            />
                        </div>
                    ) : (
                        <>
                            {/* HEADER */}
                            <div className="flex justify-between">
                                <h1 className="text-3xl leading-10 font-semibold">
                                    Manage Survey Questions
                                </h1>
                            </div>

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

                                        <div className="space-y-[6px]">
                                            <label className="text text-sm">
                                                Survey Question
                                            </label>
                                            <select className="placeholder-text-muted-foreground h-10 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
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

                                    <div className="flex items-end justify-end space-x-3 pt-[17px]">
                                        <Button variant="outline">Reset</Button>
                                        <Button>Search</Button>
                                        <Link href={questions.create().url}>
                                            <Button>
                                                Create Survey Question
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </div>

                            <div className="py-14">
                                {surveys.map(
                                    (
                                        survey: SurveyFetchProps,
                                        index: number,
                                    ) => (
                                        <div
                                            className="mb-4 rounded-lg border border-gray-100 bg-white p-2 shadow-md md:p-3"
                                            key={index}
                                        >
                                            <div className="mb-4 flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
                                                <div>
                                                    <p className="hidden pb-0 text-sm text-gray-400 md:block md:pb-6">
                                                        Survey title
                                                    </p>
                                                    <span className="text-sm font-semibold md:text-lg">
                                                        {survey.name}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="hidden pb-0 text-sm text-gray-400 md:block md:pb-6">
                                                        Description
                                                    </p>
                                                    <span className="text-sm font-semibold md:text-lg">
                                                        {survey.description}
                                                    </span>
                                                </div>
                                                <div className="flex flex-row space-x-2 md:flex-col md:space-x-0">
                                                    <p className="pb-0 text-sm text-gray-400 md:pb-6">
                                                        Status
                                                    </p>
                                                    <span
                                                        className={`rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-800 md:px-3`}
                                                    >
                                                        {survey.status}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block">
                                                    <p className="pb-0 text-sm text-gray-400 md:pb-6">
                                                        Date
                                                    </p>
                                                    <span className="text-sm text-gray-400">
                                                        {survey.created_at}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="hidden text-sm text-gray-400 md:block">
                                                        Actions
                                                    </span>
                                                    <div className="mt-3 flex space-x-3 md:mt-6 md:justify-center">
                                                        <button className="">
                                                            <PencilIcon />
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-800">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
