import React from 'react';
import type { ChildQuestionOptionState } from '@/components/ChildQuestionsModal';
import AddRecipientsStep from '@/components/survey/create/AddRecipientsStep';
import InvitationStep from '@/components/survey/create/InvitationStep';
import QuestionsStep from '@/components/survey/create/QuestionsStep';
import ReviewAndSendStep from '@/components/survey/create/ReviewAndSendStep';
import ReviewRecipientsStep from '@/components/survey/create/ReviewRecipientsStep';
import SurveyDetailsStep from '@/components/survey/create/SurveyDetailsStep';
import SurveyOutroStep from '@/components/survey/create/SurveyOutroStep';
import type {
    Contact,
    FormValues,
    GetFieldError,
    IsFieldTouched,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';

interface SurveyCreateStepContentProps {
    currentStep: number;
    sendSurveyStep: number;
    values: FormValues;
    getFieldError: GetFieldError;
    isFieldTouched: IsFieldTouched;
    setFieldValue: SetFieldValue;
    setFieldTouched: SetFieldTouched;
    contacts: Contact[];
    today: Date;
    recipientInputMode: 'contacts' | 'upload';
    setRecipientInputMode: React.Dispatch<React.SetStateAction<'contacts' | 'upload'>>;
    isParsingRecipientsFile: boolean;
    uploadedRecipientFileName: string;
    onRecipientFileUpload: (
        event: React.ChangeEvent<HTMLInputElement>,
        setFieldValue: SetFieldValue,
    ) => Promise<void>;
    childQuestionStates: Record<string, ChildQuestionOptionState>;
    setChildQuestionStates: React.Dispatch<React.SetStateAction<Record<string, ChildQuestionOptionState>>>;
}

export default function SurveyCreateStepContent({
    currentStep,
    sendSurveyStep,
    values,
    getFieldError,
    isFieldTouched,
    setFieldValue,
    setFieldTouched,
    contacts,
    today,
    recipientInputMode,
    setRecipientInputMode,
    isParsingRecipientsFile,
    uploadedRecipientFileName,
    onRecipientFileUpload,
    childQuestionStates,
    setChildQuestionStates,
}: SurveyCreateStepContentProps) {
    switch (currentStep) {
        case 0:
            return (
                <SurveyDetailsStep
                    values={values}
                    getFieldError={getFieldError}
                    isFieldTouched={isFieldTouched}
                    setFieldValue={setFieldValue}
                    setFieldTouched={setFieldTouched}
                    today={today}
                />
            );

        case 1:
            return (
                <QuestionsStep
                    values={values}
                    getFieldError={getFieldError}
                    setFieldValue={setFieldValue}
                    setFieldTouched={setFieldTouched}
                    childQuestionStates={childQuestionStates}
                    setChildQuestionStates={setChildQuestionStates}
                />
            );

        case 2:
            return (
                <SurveyOutroStep
                    values={values}
                    getFieldError={getFieldError}
                    isFieldTouched={isFieldTouched}
                    setFieldValue={setFieldValue}
                    setFieldTouched={setFieldTouched}
                />
            );

        case 3:
            switch (sendSurveyStep) {
                case 0:
                    return (
                        <AddRecipientsStep
                            values={values}
                            contacts={contacts}
                            recipientInputMode={recipientInputMode}
                            setRecipientInputMode={setRecipientInputMode}
                            isParsingRecipientsFile={isParsingRecipientsFile}
                            uploadedRecipientFileName={uploadedRecipientFileName}
                            setFieldValue={setFieldValue}
                            onRecipientFileUpload={onRecipientFileUpload}
                        />
                    );

                case 1:
                    return (
                        <ReviewRecipientsStep
                            values={values}
                            setFieldValue={setFieldValue}
                        />
                    );

                case 2:
                    return (
                        <InvitationStep
                            values={values}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            getFieldError={getFieldError}
                            isFieldTouched={isFieldTouched}
                        />
                    );

                case 3:
                    return <ReviewAndSendStep values={values} />;

                default:
                    return null;
            }

        default:
            return null;
    }
}
