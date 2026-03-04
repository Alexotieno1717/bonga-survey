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
        <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
            {children}
        </div>
    );
}
