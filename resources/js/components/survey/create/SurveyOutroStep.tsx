import type {
    FormValues,
    GetFieldError,
    IsFieldTouched,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';
import { surveyTextareaClassName } from '@/components/survey/SurveyField';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import SurveyStepIntroCard from '@/components/survey/SurveyStepIntroCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SurveyOutroStepProps {
    values: FormValues;
    setFieldValue: SetFieldValue;
    setFieldTouched: SetFieldTouched;
    getFieldError: GetFieldError;
    isFieldTouched: IsFieldTouched;
}

export default function SurveyOutroStep({
    values,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    isFieldTouched,
}: SurveyOutroStepProps) {
    const completionMessageError = isFieldTouched('completionMessage')
        ? getFieldError('completionMessage')
        : undefined;

    return (
        <div className="space-y-6">
            <SurveyStepIntroCard
                title="Compose a survey completion message (optional)"
                description="This message will be sent to participants after they answer their last question."
            />

            <SurveySectionCard className="p-5 md:p-6">
                <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Completion Message</label>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {values.completionMessage?.length || 0} chars
                    </span>
                </div>

                <textarea
                    name="completionMessage"
                    placeholder="E.g. Thank you for taking the time to complete our survey! Your feedback is invaluable to us and helps us improve."
                    className={cn(surveyTextareaClassName, 'min-h-[120px] rounded-xl')}
                    rows={4}
                    value={values.completionMessage}
                    onBlur={() => {
                        setFieldTouched('completionMessage', true);
                    }}
                    onChange={(event) => {
                        if (values.isCompletionMessageSaved) {
                            setFieldValue('isCompletionMessageSaved', false);
                        }
                        setFieldValue('completionMessage', event.target.value);
                    }}
                />

                {completionMessageError ? (
                    <div className="pt-2 text-xs text-red-500">{completionMessageError}</div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        Leave empty if you do not want to send a completion SMS.
                    </p>
                    <Button
                        type="button"
                        variant={(values.isCompletionMessageSaved ? 'secondary' : 'default') as 'default' | 'secondary'}
                        onClick={async () => {
                            if (!values.completionMessage) {
                                return;
                            }

                            setFieldValue('isSavingCompletionMessage', true);
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            setFieldValue('isSavingCompletionMessage', false);
                            setFieldValue('isCompletionMessageSaved', true);
                        }}
                        disabled={values.isCompletionMessageSaved || !values.completionMessage}
                    >
                        {values.isSavingCompletionMessage ? 'Saving...' : 'Save Message'}
                    </Button>
                </div>
            </SurveySectionCard>
        </div>
    );
}
