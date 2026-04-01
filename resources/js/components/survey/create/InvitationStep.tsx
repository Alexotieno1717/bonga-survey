import { getCurrentDateTimeLocalValue } from '@/components/survey/create/create-utils';
import type {
    FormValues,
    GetFieldError,
    IsFieldTouched,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';
import SurveyField, { surveyTextareaClassName } from '@/components/survey/SurveyField';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import SurveyStepIntroCard from '@/components/survey/SurveyStepIntroCard';
import { cn } from '@/lib/utils';

interface InvitationStepProps {
    values: FormValues;
    setFieldValue: SetFieldValue;
    setFieldTouched: SetFieldTouched;
    getFieldError: GetFieldError;
    isFieldTouched: IsFieldTouched;
}

export default function InvitationStep({
    values,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    isFieldTouched,
}: InvitationStepProps) {
    const invitationMessageError = isFieldTouched('invitationMessage')
        ? getFieldError('invitationMessage')
        : undefined;
    const scheduleTimeError = isFieldTouched('scheduleTime')
        ? getFieldError('scheduleTime')
        : undefined;

    return (
        <div className="space-y-6">
            <SurveyStepIntroCard
                title="Compose Invitation"
                description="Compose an invitation message for opting into your survey and schedule when it should be sent."
            />

            <SurveySectionCard className="p-5 md:p-6">
                <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Invitation Message</label>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-100">
                        {values.invitationMessage.length || 0} chars
                    </span>
                </div>
                <textarea
                    name="invitationMessage"
                    className={cn(surveyTextareaClassName, 'min-h-30 rounded-xl')}
                    rows={4}
                    placeholder="Reply with START to participate"
                    value={values.invitationMessage}
                    onBlur={() => {
                        setFieldTouched('invitationMessage', true);
                    }}
                    onChange={(event) => {
                        setFieldValue('invitationMessage', event.target.value);
                    }}
                />

                {invitationMessageError ? (
                    <p className="pt-2 text-xs text-red-500">{invitationMessageError}</p>
                ) : null}

                <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-200">
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-500/35 dark:bg-slate-800/70">
                        This message contains the following additional characters for Safaricom recipients:
                        {' '}
                        STOP*456*9*5#
                    </p>
                    <p>
                        {values.invitationMessage.length || 0} characters 1 message(s) . GSM 7 Encoding
                    </p>
                </div>
            </SurveySectionCard>

            <SurveySectionCard className="p-5 md:p-6">
                <SurveyField label="Schedule Time" error={scheduleTimeError}>
                    <div className="mt-1 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-500/35 dark:bg-slate-800/70">
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                values.scheduleMode === 'now'
                                    ? 'bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'
                            }`}
                            onClick={() => {
                                setFieldValue('scheduleMode', 'now');
                                setFieldValue('scheduleTime', getCurrentDateTimeLocalValue());
                            }}
                        >
                            Send Now
                        </button>
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                values.scheduleMode === 'later'
                                    ? 'bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'
                            }`}
                            onClick={() => {
                                setFieldValue('scheduleMode', 'later');
                                setFieldValue('scheduleTime', '');
                                setFieldTouched('scheduleTime', true);
                            }}
                        >
                            Schedule for Later
                        </button>
                    </div>

                    <input
                        type="datetime-local"
                        name="scheduleTime"
                        disabled={values.scheduleMode === 'now'}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-slate-500/40 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40"
                        value={
                            values.scheduleMode === 'now'
                                ? getCurrentDateTimeLocalValue()
                                : values.scheduleTime
                        }
                        onBlur={() => {
                            setFieldTouched('scheduleTime', true);
                        }}
                        onChange={(event) => {
                            setFieldValue('scheduleTime', event.target.value);
                        }}
                    />
                    {values.scheduleMode === 'now' ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                            Survey will be sent immediately after publish.
                        </p>
                    ) : null}
                </SurveyField>
            </SurveySectionCard>
        </div>
    );
}
