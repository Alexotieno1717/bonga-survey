import type { ReactNode } from 'react';
import SurveySectionCard from '@/components/survey/SurveySectionCard';

interface SurveyQuestionCardProps {
    questionNumber: number;
    responseType: 'free-text' | 'multiple-choice';
    children: ReactNode;
}

export default function SurveyQuestionCard({
    questionNumber,
    responseType,
    children,
}: SurveyQuestionCardProps) {
    return (
        <SurveySectionCard className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-sky-500/20 dark:text-sky-100">
                        {questionNumber}
                    </span>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Question {questionNumber}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-100">
                    {responseType === 'multiple-choice' ? 'Multiple choice' : 'Free text'}
                </span>
            </div>
            {children}
        </SurveySectionCard>
    );
}
