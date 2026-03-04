import type { ReactNode } from 'react';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import { cn } from '@/lib/utils';

interface SurveyStepIntroCardProps {
    title: ReactNode;
    description?: ReactNode;
    className?: string;
    contentClassName?: string;
}

export default function SurveyStepIntroCard({
    title,
    description,
    className,
    contentClassName,
}: SurveyStepIntroCardProps) {
    return (
        <SurveySectionCard className={cn('px-5 py-4 md:px-6', className)}>
            <div className={cn('space-y-1', contentClassName)}>
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                {description ? <p className="text-sm text-slate-500">{description}</p> : null}
            </div>
        </SurveySectionCard>
    );
}
