import type { ReactNode } from 'react';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import { cn } from '@/lib/utils';

interface SurveyDataTableCardProps {
    children: ReactNode;
    className?: string;
}

export default function SurveyDataTableCard({
    children,
    className,
}: SurveyDataTableCardProps) {
    return (
        <SurveySectionCard className={cn('overflow-hidden p-4', className)}>
            {children}
        </SurveySectionCard>
    );
}
