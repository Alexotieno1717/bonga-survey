import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SurveySectionCardProps {
    children: ReactNode;
    className?: string;
}

export default function SurveySectionCard({
    children,
    className,
}: SurveySectionCardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-500/35 dark:bg-slate-900/55 dark:shadow-slate-900/40',
                className,
            )}
        >
            {children}
        </div>
    );
}
