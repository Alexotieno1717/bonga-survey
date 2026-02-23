import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { SurveyFetchProps } from '@/pages/surveys/question/Index';
import questions from '@/routes/questions';
import type { BreadcrumbItem } from '@/types';

// export type SurveyStatus = 'draft' | 'scheduled' | 'active' | 'completed';

// export interface BranchingCondition {
//     answer: string | number;
//     next_question_id: number | null;
// }
//
// export type BranchingLogic = BranchingCondition[];
//
// export interface SurveyFetchProps {
//     id: number;
//     name: string;
//     description: string;
//     trigger_word: string;
//
//     invitation_message: string;
//     completion_message: string | null;
//
//     branching_logic: BranchingLogic | null;
//
//     start_date: string;
//     end_date: string;
//     scheduled_time: string;
//
//     status: SurveyStatus;
//
//     created_by: number;
//     created_at: string;
//     updated_at: string;
// }

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Surveys Questions Show',
        href: questions.index().url,
    },
];

export default function Show() {
    const survey = usePage().props as unknown as {
        survey: SurveyFetchProps;
    }

    console.log(survey.survey);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-lg bg-white py-4">
                    Show Question
                    <h1>Question name: {survey.survey.name}</h1>
                    <h1>Question name: {survey.survey.description}</h1>
                </div>
            </div>
        </AppLayout>
    );
}
