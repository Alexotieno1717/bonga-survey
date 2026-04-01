interface SurveyCreateTabsProps {
    currentStep: number;
    questionCount: number;
    isStep0Complete: boolean;
    isStep1Complete: boolean;
    isStep2Complete: boolean;
}

export default function SurveyCreateTabs({
    currentStep,
    questionCount,
    isStep0Complete,
    isStep1Complete,
    isStep2Complete,
}: SurveyCreateTabsProps) {
    return (
        <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white p-1 text-muted-foreground dark:border-slate-500/35 dark:bg-slate-900/60">
            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 0
                        ? 'bg-blue-500 text-white dark:bg-sky-500 dark:text-slate-950'
                        : 'bg-white text-gray-500 dark:bg-transparent dark:text-slate-300'
                }`}
            >
                Survey Details
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 1
                        ? 'bg-blue-500 text-white dark:bg-sky-500 dark:text-slate-950'
                        : isStep0Complete
                            ? 'bg-white text-gray-500 dark:bg-transparent dark:text-slate-300'
                            : 'text-gray-400 dark:text-slate-500'
                }`}
            >
                Questions ({questionCount})
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 2
                        ? 'bg-blue-500 text-white dark:bg-sky-500 dark:text-slate-950'
                        : isStep1Complete
                            ? 'bg-white text-gray-500 dark:bg-transparent dark:text-slate-300'
                            : 'text-gray-400 dark:text-slate-500'
                }`}
            >
                Survey Outro
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 3
                        ? 'bg-blue-500 text-white dark:bg-sky-500 dark:text-slate-950'
                        : isStep2Complete
                            ? 'bg-white text-gray-500 dark:bg-transparent dark:text-slate-300'
                            : 'text-gray-400 dark:text-slate-500'
                }`}
            >
                Send Survey
            </div>
        </div>
    );
}
