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
        <div className="inline-flex h-9 items-center rounded-lg bg-muted text-muted-foreground">
            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-500'
                }`}
            >
                Survey Details
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 1
                        ? 'bg-blue-500 text-white'
                        : isStep0Complete
                          ? 'bg-white text-gray-500'
                          : 'text-gray-400'
                }`}
            >
                Questions ({questionCount})
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 2
                        ? 'bg-blue-500 text-white'
                        : isStep1Complete
                          ? 'bg-white text-gray-500'
                          : 'text-gray-400'
                }`}
            >
                Survey Outro
            </div>

            <div
                className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                    currentStep === 3
                        ? 'bg-blue-500 text-white'
                        : isStep2Complete
                          ? 'bg-white text-gray-500'
                          : 'text-gray-400'
                }`}
            >
                Send Survey
            </div>
        </div>
    );
}
