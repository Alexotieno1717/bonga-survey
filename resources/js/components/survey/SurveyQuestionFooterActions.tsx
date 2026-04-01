import { Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SurveyQuestionFooterActionsProps {
    questionLength: number;
    isEditing: boolean;
    isSaved: boolean;
    isSaving: boolean;
    onSave: () => void | Promise<void>;
    onDelete: () => void;
}

export default function SurveyQuestionFooterActions({
    questionLength,
    isEditing,
    isSaved,
    isSaving,
    onSave,
    onDelete,
}: SurveyQuestionFooterActionsProps) {
    return (
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-500/35">
            <p className="text-sm text-slate-500 dark:text-slate-200">{questionLength} characters</p>
            <div className="flex items-center gap-3">
                {(isEditing || !isSaved) ? (
                    <div className="flex items-center space-x-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-400/35 dark:bg-amber-500/15">
                        <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-200" />
                        <span className={`text-xs ${isSaving ? 'text-amber-700' : 'text-red-600'}`}>
                            {isSaving ? 'Saving Question...' : 'Question Not Saved'}
                        </span>
                    </div>
                ) : null}

                {(isEditing || !isSaved) ? (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onSave}
                        className="h-9"
                    >
                        Save Question
                    </Button>
                ) : null}

                {(isSaved && !isEditing) ? (
                    <button
                        type="button"
                        className="rounded-md border border-slate-300 p-2 text-slate-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-400/35 dark:text-slate-200 dark:hover:border-red-400/60 dark:hover:bg-red-500/20 dark:hover:text-red-200"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
