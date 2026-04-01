import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { buildDefaultInvitationMessage } from '@/components/survey/create/create-utils';
import type {
    FormValues,
    GetFieldError,
    IsFieldTouched,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';
import SurveyField, {
    surveyInputClassName,
    surveySelectClassName,
    surveyTextareaClassName,
} from '@/components/survey/SurveyField';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import SurveyStepIntroCard from '@/components/survey/SurveyStepIntroCard';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SurveyDetailsStepProps {
    values: FormValues;
    setFieldValue: SetFieldValue;
    setFieldTouched: SetFieldTouched;
    getFieldError: GetFieldError;
    isFieldTouched: IsFieldTouched;
    today: Date;
}

export default function SurveyDetailsStep({
    values,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    isFieldTouched,
    today,
}: SurveyDetailsStepProps) {
    const resolveFieldError = (field: string): string | undefined => {
        if (!isFieldTouched(field)) {
            return undefined;
        }

        return getFieldError(field);
    };

    return (
        <div className="space-y-6">
            <SurveyStepIntroCard
                title="Create Survey"
                description="Set survey details, timeline, shortcode, and trigger word before adding questions."
            />

            <SurveySectionCard className="p-5 md:p-6">
                <div className="space-y-5">
                    <SurveyField
                        label="Survey Name"
                        error={resolveFieldError('surveyName')}
                    >
                        <input
                            name="surveyName"
                            type="text"
                            className={surveyInputClassName}
                            placeholder="Enter survey title"
                            value={values.surveyName}
                            onBlur={() => {
                                setFieldTouched('surveyName', true);
                            }}
                            onChange={(event) => {
                                setFieldValue('surveyName', event.target.value);
                            }}
                        />
                    </SurveyField>

                    <SurveyField
                        label="Description"
                        error={resolveFieldError('description')}
                    >
                        <textarea
                            name="description"
                            className={cn(surveyTextareaClassName, 'min-h-[110px]')}
                            placeholder="Write a short description of this survey"
                            value={values.description}
                            onBlur={() => {
                                setFieldTouched('description', true);
                            }}
                            onChange={(event) => {
                                setFieldValue('description', event.target.value);
                            }}
                        />
                    </SurveyField>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                        <SurveyField
                            label="Start Date"
                            error={resolveFieldError('startDate')}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50 dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800/70',
                                            !values.startDate && 'text-muted-foreground',
                                        )}
                                    >
                                        {values.startDate ? (
                                            format(values.startDate, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <DatePicker
                                        value={values.startDate}
                                        minDate={today}
                                        onBlur={() => {
                                            setFieldTouched('startDate', true);
                                        }}
                                        onSelectDate={(date) => {
                                            setFieldValue('startDate', date ?? null);

                                            if (!date) {
                                                return;
                                            }

                                            if (values.endDate && values.endDate < date) {
                                                setFieldValue('endDate', null);
                                            }
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </SurveyField>

                        <SurveyField
                            label="End Date"
                            error={resolveFieldError('endDate')}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50 dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800/70',
                                            !values.endDate && 'text-muted-foreground',
                                        )}
                                    >
                                        {values.endDate ? (
                                            format(values.endDate, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <DatePicker
                                        value={values.endDate}
                                        minDate={values.startDate ?? today}
                                        onBlur={() => {
                                            setFieldTouched('endDate', true);
                                        }}
                                        onSelectDate={(date) => {
                                            setFieldValue('endDate', date ?? null);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </SurveyField>
                    </div>
                </div>
            </SurveySectionCard>

            <SurveySectionCard className="p-5 md:p-6">
                <div className="space-y-5">
                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                        <SurveyField
                            label="Short Code"
                            error={resolveFieldError('shortCode')}
                        >
                            <select
                                name="shortCode"
                                className={surveySelectClassName}
                                value={values.shortCode}
                                onBlur={() => {
                                    setFieldTouched('shortCode', true);
                                }}
                                onChange={(event) => {
                                    setFieldValue('shortCode', event.target.value);
                                }}
                            >
                                <option value="20642">20642</option>
                            </select>
                        </SurveyField>

                        <SurveyField
                            label="Trigger Word"
                            error={resolveFieldError('triggerWord')}
                        >
                            <input
                                type="text"
                                name="triggerWord"
                                placeholder="Enter trigger word"
                                value={values.triggerWord}
                                className={cn(surveyInputClassName, 'px-3 disabled:cursor-not-allowed disabled:opacity-50')}
                                onBlur={() => {
                                    setFieldTouched('triggerWord', true);
                                }}
                                onChange={(event) => {
                                    const nextTriggerWord = event.target.value;
                                    const previousDefaultMessage = buildDefaultInvitationMessage(values.triggerWord);
                                    const nextDefaultMessage = buildDefaultInvitationMessage(nextTriggerWord);
                                    const currentInvitationMessage = values.invitationMessage ?? '';

                                    setFieldValue('triggerWord', nextTriggerWord);

                                    if (
                                        currentInvitationMessage.trim() === '' ||
                                        currentInvitationMessage === previousDefaultMessage
                                    ) {
                                        setFieldValue('invitationMessage', nextDefaultMessage);
                                    }
                                }}
                            />
                        </SurveyField>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-500/35 dark:bg-slate-800/70 dark:text-slate-200">
                        <p>User will text your keyword to the shortcode to start the survey.</p>
                        <p className="mt-2">Once the survey is published, details cannot be updated.</p>
                    </div>
                </div>
            </SurveySectionCard>
        </div>
    );
}
