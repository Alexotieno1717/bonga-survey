import { cn } from '@/lib/utils';

interface SurveyBranchingSelectProps {
    name?: string;
    currentQuestionIndex: number;
    questionCount: number;
    noMoreLabel: string;
    className?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

export default function SurveyBranchingSelect({
    name,
    currentQuestionIndex,
    questionCount,
    noMoreLabel,
    className,
    value,
    onChange,
    onBlur,
}: SurveyBranchingSelectProps) {
    return (
        <select
            name={name}
            value={value}
            onChange={(event) => {
                onChange(event.target.value);
            }}
            onBlur={onBlur}
            className={cn(
                'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40',
                className,
            )}
        >
            <option value="0" disabled className="text-gray-400">
                Next Question, if added
            </option>
            {Array.from({ length: questionCount }, (_, questionIndex) => {
                if (questionIndex === currentQuestionIndex) {
                    return null;
                }

                return (
                    <option key={questionIndex} value={questionIndex}>
                        Question {questionIndex + 1}
                    </option>
                );
            })}
            <option className="disabled:cursor-not-allowed" value="-2" disabled>
                {noMoreLabel}
            </option>
            <option value="-1">End Survey</option>
        </select>
    );
}
