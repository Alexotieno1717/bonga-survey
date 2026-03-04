import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const surveyInputClassName =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none';

export const surveySelectClassName =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none';

export const surveyTextareaClassName =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none';

interface SurveyFieldProps {
    label: ReactNode;
    children: ReactNode;
    error?: ReactNode;
    className?: string;
    labelClassName?: string;
}

export default function SurveyField({
    label,
    children,
    error,
    className,
    labelClassName,
}: SurveyFieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <label className={cn('block text-sm font-medium text-slate-700', labelClassName)}>
                {label}
            </label>
            {children}
            {error ? <div className="text-sm text-red-500">{error}</div> : null}
        </div>
    );
}
