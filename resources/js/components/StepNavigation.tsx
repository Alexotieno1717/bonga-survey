import React from 'react';

interface Step {
    id: number;
    label: string;
}

interface StepNavigationProps {
    steps: Step[];
    currentStep: number;
    onStepClick: (step: number) => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
    steps,
    currentStep,
    onStepClick,
}) => {
    return (
        <div className="flex items-center lg:ml-12 lg:rounded-lg lg:bg-white lg:p-4 lg:shadow lg:dark:bg-slate-900/60 lg:dark:shadow-slate-900/40">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    {/* Step Number */}
                    <div
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-colors lg:h-10 lg:w-10 ${
                            currentStep === index
                                ? 'border-2 border-blue-600 bg-blue-600 text-white dark:border-sky-400 dark:bg-sky-500 dark:text-slate-950'
                                : 'border-2 border-gray-300 bg-white text-gray-500 dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-300'
                        }`}
                        onClick={() => onStepClick(index)}
                    >
                        {step.id}
                    </div>

                    {/* Step Label */}
                    <span
                        className={`ml-2 text-sm font-medium ${
                            currentStep === index
                                ? 'text-blue-600 dark:text-sky-300'
                                : 'text-gray-500 dark:text-slate-300'
                        }`}
                    >
                        {step.label}
                    </span>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`h-[2px] w-8 lg:w-10 ${
                                currentStep > index
                                    ? 'bg-blue-600 dark:bg-sky-400'
                                    : 'bg-gray-300 dark:bg-slate-500/40'
                            }`}
                            onClick={() => onStepClick(index)}
                        ></div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StepNavigation;
