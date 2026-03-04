import { format } from 'date-fns';
import { ErrorMessage, Field } from 'formik';
import type { FormikErrors, FormikTouched } from 'formik';
import { CalendarIcon } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { buildDefaultInvitationMessage } from '@/components/survey/create/create-utils';
import type { FormValues, SetFieldValue } from '@/components/survey/create/types';
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
    errors: FormikErrors<FormValues>;
    touched: FormikTouched<FormValues>;
    setFieldValue: SetFieldValue;
    today: Date;
}

export default function SurveyDetailsStep({
    values,
    errors,
    touched,
    setFieldValue,
    today,
}: SurveyDetailsStepProps) {
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
                        error={errors.surveyName && touched.surveyName ? <ErrorMessage name="surveyName" /> : null}
                    >
                        <Field
                            name="surveyName"
                            type="text"
                            className={surveyInputClassName}
                            placeholder="Enter survey title"
                        />
                    </SurveyField>

                    <SurveyField
                        label="Description"
                        error={errors.description && touched.description ? <ErrorMessage name="description" /> : null}
                    >
                        <Field
                            name="description"
                            as="textarea"
                            className={cn(surveyTextareaClassName, 'min-h-[110px]')}
                            placeholder="Write a short description of this survey"
                        />
                    </SurveyField>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                        <SurveyField
                            label="Start Date"
                            error={errors.startDate && touched.startDate ? <ErrorMessage name="startDate" /> : null}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50',
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
                                        name="startDate"
                                        minDate={today}
                                        onSelectDate={(date) => {
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
                            error={errors.endDate && touched.endDate ? <ErrorMessage name="endDate" /> : null}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            'h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50',
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
                                        name="endDate"
                                        minDate={values.startDate ?? today}
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
                            error={errors.shortCode && touched.shortCode ? <ErrorMessage name="shortCode" /> : null}
                        >
                            <Field
                                as="select"
                                name="shortCode"
                                className={surveySelectClassName}
                            >
                                <option value="20642">20642</option>
                            </Field>
                        </SurveyField>

                        <SurveyField
                            label="Trigger Word"
                            error={errors.triggerWord && touched.triggerWord ? <ErrorMessage name="triggerWord" /> : null}
                        >
                            <Field
                                type="text"
                                name="triggerWord"
                                placeholder="Enter trigger word"
                                cols={30}
                                rows={5}
                                className={cn(surveyInputClassName, 'px-3 disabled:cursor-not-allowed disabled:opacity-50')}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        <p>User will text your keyword to the shortcode to start the survey.</p>
                        <p className="mt-2">Once the survey is published, details cannot be updated.</p>
                    </div>
                </div>
            </SurveySectionCard>
        </div>
    );
}
