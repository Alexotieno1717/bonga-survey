import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SurveyToolbarActionVariant = 'neutral' | 'primary' | 'danger';

interface SurveyToolbarActionButtonProps {
    icon: ReactNode;
    label: string;
    variant: SurveyToolbarActionVariant;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
}

const variantClasses: Record<SurveyToolbarActionVariant, string> = {
    neutral: 'border border-[#E3E5EB] bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-500 hover:shadow-md dark:border-slate-500/40 dark:text-slate-200 dark:hover:text-white',
    primary: 'border border-blue-500 bg-transparent text-blue-500 hover:bg-transparent hover:text-blue-500 hover:shadow-md dark:border-sky-400/60 dark:text-sky-100 dark:hover:text-sky-100',
    danger: 'border border-red-400 bg-transparent text-red-500 hover:bg-transparent hover:text-red-500 hover:shadow-md dark:border-red-400/60 dark:text-red-200 dark:hover:text-red-100',
};

export default function SurveyToolbarActionButton({
    icon,
    label,
    variant,
    type = 'button',
    onClick,
}: SurveyToolbarActionButtonProps) {
    return (
        <Button
            type={type}
            variant="outline"
            onClick={onClick}
            className={cn('flex items-center justify-center space-x-2 shadow-sm focus:outline-none', variantClasses[variant])}
        >
            {icon}
            <span>{label}</span>
        </Button>
    );
}
