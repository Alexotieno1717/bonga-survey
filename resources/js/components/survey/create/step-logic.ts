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
    validateDetailsStep: () => boolean;
    validateQuestionsStep: () => boolean;
    submitForm: () => void;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    setSendSurveyStep: React.Dispatch<React.SetStateAction<number>>;
}

export const handleSurveyNextStep = ({
    currentStep,
    sendSurveyStep,
    values,
    validateDetailsStep,
    validateQuestionsStep,
    submitForm,
    setCurrentStep,
    setSendSurveyStep,
}: HandleSurveyNextStepParams): void => {
    switch (currentStep) {
        case 0:
            if (validateDetailsStep()) {
                setCurrentStep(currentStep + 1);
            }
            break;

        case 1:
            if (validateQuestionsStep()) {
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
