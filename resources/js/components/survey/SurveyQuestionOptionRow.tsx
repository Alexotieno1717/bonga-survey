import SurveyBranchingSelect from '@/components/survey/SurveyBranchingSelect';
import { Button } from '@/components/ui/button';

interface SurveyQuestionOptionRowProps {
    optionIndex: number;
    optionValue: string;
    questionIndex: number;
    questionCount: number;
    allowMultiple: boolean;
    isOptionSaved: boolean;
    branchingFieldName: string;
    branchingValue: string;
    onBranchingChange: (value: string) => void;
    onBranchingBlur?: () => void;
    childQuestionsButtonLabel: string;
    onRemove: () => void;
    onOptionChange: (value: string) => void;
    onSaveOption: () => void;
    onOpenChildQuestions: () => void;
}

export default function SurveyQuestionOptionRow({
    optionIndex,
    optionValue,
    questionIndex,
    questionCount,
    allowMultiple,
    isOptionSaved,
    branchingFieldName,
    branchingValue,
    onBranchingChange,
    onBranchingBlur,
    childQuestionsButtonLabel,
    onRemove,
    onOptionChange,
    onSaveOption,
    onOpenChildQuestions,
}: SurveyQuestionOptionRowProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Label {optionIndex + 1}</span>
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700"
                >
                    <span className="text-base">×</span>
                    <span>Remove</span>
                </button>
            </div>

            <div
                className={`grid grid-cols-1 gap-3 md:items-end ${
                    allowMultiple
                        ? 'md:grid-cols-[minmax(0,1fr)_220px]'
                        : 'md:grid-cols-[minmax(0,1fr)_220px_220px]'
                }`}
            >
                <input
                    value={optionValue}
                    type="text"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    placeholder={`Option ${optionIndex + 1}`}
                    onChange={(event) => {
                        onOptionChange(event.target.value);
                    }}
                />

                {isOptionSaved ? (
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full border-blue-400 text-blue-700 hover:bg-blue-50"
                            onClick={onOpenChildQuestions}
                        >
                            {childQuestionsButtonLabel}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-end">
                        {optionValue.trim().length > 0 ? (
                            <Button
                                type="button"
                                className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                                onClick={onSaveOption}
                            >
                                Save Option
                            </Button>
                        ) : (
                            <div className="h-10 w-full" />
                        )}
                    </div>
                )}

                {!allowMultiple && isOptionSaved ? (
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">After child questions, go to:</label>
                        <SurveyBranchingSelect
                            name={branchingFieldName}
                            currentQuestionIndex={questionIndex}
                            questionCount={questionCount}
                            noMoreLabel="-- No More Options --"
                            value={branchingValue}
                            onChange={onBranchingChange}
                            onBlur={onBranchingBlur}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
