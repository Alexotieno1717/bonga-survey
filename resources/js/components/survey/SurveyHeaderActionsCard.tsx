import type { ReactNode } from 'react';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import { cn } from '@/lib/utils';

interface SurveyHeaderActionsCardProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export default function SurveyHeaderActionsCard({
    title,
    description,
    actions,
    className,
}: SurveyHeaderActionsCardProps) {
    return (
        <SurveySectionCard className={cn('px-5 py-4 md:px-6', className)}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
                    {description ? <p className="text-sm text-slate-500 dark:text-slate-200">{description}</p> : null}
                </div>
                {actions ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                        {actions}
                    </div>
                ) : null}
            </div>
        </SurveySectionCard>
    );
}
