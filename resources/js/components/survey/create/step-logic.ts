import type { FormikErrors, FormikTouched } from 'formik';
import { toast } from 'sonner';
import type { FormValues, Question } from '@/components/survey/create/types';

export const isSurveyCreateStep0Complete = (
    values: FormValues,
    isTriggerWordUnique: (value: string) => boolean,
): boolean => {
    return Boolean(
        values.surveyName &&
        values.description &&
        values.startDate &&
        values.endDate &&
        values.shortCode &&
        values.triggerWord &&
        isTriggerWordUnique(values.triggerWord),
    );
};

export const isSurveyCreateStep1Complete = (values: FormValues): boolean => {
    return values.questions.every(
        (question: Question) =>
            question.question &&
            question.responseType &&
            (question.responseType === 'free-text' || question.options.length > 0),
    );
};

interface HandleSurveyNextStepParams {
    currentStep: number;
    sendSurveyStep: number;
    values: FormValues;
    validateField: (
        field: string,
    ) => Promise<void> | Promise<string | undefined>;
    setTouched: (
        touched: FormikTouched<FormValues>,
        shouldValidate?: boolean,
    ) => Promise<void | FormikErrors<FormValues>>;
    errors: FormikErrors<FormValues>;
    submitForm: () => Promise<void>;
    isTriggerWordUnique: (value: string) => boolean;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    setSendSurveyStep: React.Dispatch<React.SetStateAction<number>>;
}

export const handleSurveyNextStep = ({
    currentStep,
    sendSurveyStep,
    values,
    validateField,
    setTouched,
    errors,
    submitForm,
    isTriggerWordUnique,
    setCurrentStep,
    setSendSurveyStep,
}: HandleSurveyNextStepParams): void => {
    switch (currentStep) {
        case 0:
            if (
                !values.surveyName ||
                !values.description ||
                !values.startDate ||
                !values.endDate ||
                !values.shortCode ||
                !values.triggerWord ||
                !isTriggerWordUnique(values.triggerWord)
            ) {
                validateField('surveyName');
                validateField('description');
                validateField('startDate');
                validateField('endDate');
                validateField('shortCode');
                validateField('triggerWord');
                setTouched(
                    {
                        surveyName: true,
                        description: true,
                        startDate: true,
                        endDate: true,
                        shortCode: true,
                        triggerWord: true,
                    },
                    true,
                );
            } else if (
                !errors.surveyName &&
                !errors.description &&
                !errors.startDate &&
                !errors.endDate &&
                !errors.shortCode &&
                !errors.triggerWord &&
                isTriggerWordUnique(values.triggerWord)
            ) {
                setCurrentStep(currentStep + 1);
            }
            break;

        case 1:
            if (
                values.questions.some(
                    (question: Question) =>
                        !question.question ||
                        !question.responseType ||
                        (question.responseType === 'multiple-choice' && question.options.length === 0),
                )
            ) {
                values.questions.forEach((_, index) => {
                    validateField(`questions[${index}].question`);
                    validateField(`questions[${index}].responseType`);
                });
                setTouched({
                    questions: values.questions.map(() => ({
                        question: true,
                        responseType: true,
                    })),
                });
            } else if (!errors.questions) {
                setCurrentStep(currentStep + 1);
            }
            break;

        case 2:
            if (
                values.completionMessage &&
                !values.isCompletionMessageSaved
            ) {
                toast.error(
                    'Please save the completion message before proceeding.',
                    { position: 'top-center', richColors: true },
                );
                return;
            }
            setCurrentStep(currentStep + 1);
            break;

        case 3:
            if (sendSurveyStep < 3) {
                if (sendSurveyStep === 0 && values.recipients.length === 0) {
                    toast.error('Please select at least one recipient.', {
                        position: 'top-center',
                        richColors: true,
                    });
                    return;
                }
                setSendSurveyStep(sendSurveyStep + 1);
            } else {
                if (values.recipients.length === 0) {
                    toast.error('Please select at least one recipient.', {
                        position: 'top-center',
                        richColors: true,
                    });
                    return;
                }
                if (!values.invitationMessage) {
                    toast.error('Please enter an invitation message.', {
                        position: 'top-center',
                        richColors: true,
                    });
                    return;
                }
                if (values.scheduleMode === 'later' && !values.scheduleTime) {
                    toast.error('Please select a schedule time.', {
                        position: 'top-center',
                        richColors: true,
                    });
                    return;
                }
                submitForm();
            }
            break;

        default:
            break;
    }
};
