import type { RequestPayload } from '@inertiajs/core';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import type { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'sonner';
import type { ChildQuestionOptionState } from '@/components/ChildQuestionsModal';
import StepNavigation from '@/components/StepNavigation';
import {
    surveyCreateInitialValues,
    surveyCreateSteps,
    surveyCreateToday,
} from '@/components/survey/create/constants';
import { getCurrentDateTimeLocalValue } from '@/components/survey/create/create-utils';
import {
    handleRecipientFileUpload,
} from '@/components/survey/create/recipients';
import {
    handleSurveyNextStep,
    isSurveyCreateStep0Complete,
    isSurveyCreateStep1Complete,
} from '@/components/survey/create/step-logic';
import { submitSurveyPayload } from '@/components/survey/create/submit';
import { buildSurveyPayload } from '@/components/survey/create/survey-payload';
import SurveyCreateFooterActions from '@/components/survey/create/SurveyCreateFooterActions';
import SurveyCreateStepContent from '@/components/survey/create/SurveyCreateStepContent';
import SurveyCreateTabs from '@/components/survey/create/SurveyCreateTabs';
import type { Contact, FormValues, SetFieldValue } from '@/components/survey/create/types';
import { buildSurveyCreateValidationSchema } from '@/components/survey/create/validation';
import AppLayout from '@/layouts/app-layout';

interface PageProps extends InertiaPageProps {
    contacts: Contact[];
    contactGroups?: Array<{
        id: number;
        name: string;
    }>;
    existingTriggerWords: string[];
}

export default function Create() {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [sendSurveyStep, setSendSurveyStep] = useState<number>(0);
    const [recipientInputMode, setRecipientInputMode] = useState<'contacts' | 'upload'>('contacts');
    const [uploadedRecipientFileName, setUploadedRecipientFileName] = useState('');
    const [isParsingRecipientsFile, setIsParsingRecipientsFile] = useState(false);
    const [childQuestionStates, setChildQuestionStates] = useState<Record<string, ChildQuestionOptionState>>({});

    const { contacts, existingTriggerWords } = usePage<PageProps>().props;

    const normalizeTriggerWord = (value: string): string => value.trim().toLowerCase();
    const isTriggerWordUnique = (value: string): boolean => {
        const normalizedValue = normalizeTriggerWord(value);

        if (normalizedValue.length === 0) {
            return false;
        }

        return !existingTriggerWords.includes(normalizedValue);
    };

    const validationSchema = buildSurveyCreateValidationSchema(existingTriggerWords, surveyCreateToday);

    const handleSubmit = async (
        values: FormValues,
        { setSubmitting }: FormikHelpers<FormValues>,
    ): Promise<void> => {
        try {
            const payload = buildSurveyPayload({
                values,
                childQuestionStates,
                formattedStartDate: values.startDate ? format(values.startDate, 'yyyy-MM-dd') : '',
                formattedEndDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : '',
                scheduleTime: values.scheduleMode === 'now'
                    ? getCurrentDateTimeLocalValue()
                    : values.scheduleTime,
            });

            submitSurveyPayload({
                payload: payload as RequestPayload,
                submissionAction: values.submissionAction,
                onFinish: () => {
                    setSubmitting(false);
                },
            });
        } catch (error) {
            console.error('Error submitting survey:', error);
            toast.error('An unexpected error occurred.', {
                position: 'top-center',
                richColors: true,
            });
            setSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Create Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Formik
                    initialValues={surveyCreateInitialValues}
                    onSubmit={handleSubmit}
                    validationSchema={validationSchema}
                >
                    {({
                        values,
                        validateField,
                        touched,
                        setTouched,
                        errors,
                        setFieldValue,
                        submitForm,
                        isSubmitting,
                    }) => {
                        return (
                            <>
                                <SurveyCreateTabs
                                    currentStep={currentStep}
                                    questionCount={values.questions.length}
                                    isStep0Complete={isSurveyCreateStep0Complete(values, isTriggerWordUnique)}
                                    isStep1Complete={isSurveyCreateStep1Complete(values)}
                                    isStep2Complete={true}
                                />

                                {currentStep === 3 ? (
                                    <StepNavigation
                                        steps={surveyCreateSteps}
                                        currentStep={sendSurveyStep}
                                        onStepClick={(step) =>
                                            setSendSurveyStep(step)
                                        }
                                    />
                                ) : null}

                                <Form className="bg-white">
                                    <SurveyCreateStepContent
                                        currentStep={currentStep}
                                        sendSurveyStep={sendSurveyStep}
                                        values={values}
                                        errors={errors as FormikErrors<FormValues>}
                                        touched={touched as FormikTouched<FormValues>}
                                        setFieldValue={setFieldValue as SetFieldValue}
                                        contacts={contacts}
                                        today={surveyCreateToday}
                                        recipientInputMode={recipientInputMode}
                                        setRecipientInputMode={setRecipientInputMode}
                                        isParsingRecipientsFile={isParsingRecipientsFile}
                                        uploadedRecipientFileName={uploadedRecipientFileName}
                                        onRecipientFileUpload={async (
                                            event,
                                            innerSetFieldValue,
                                        ) => {
                                            await handleRecipientFileUpload({
                                                event,
                                                setFieldValue: innerSetFieldValue,
                                                setUploadedRecipientFileName,
                                                setIsParsingRecipientsFile,
                                            });
                                        }}
                                        childQuestionStates={childQuestionStates}
                                        setChildQuestionStates={setChildQuestionStates}
                                    />

                                    <SurveyCreateFooterActions
                                        currentStep={currentStep}
                                        sendSurveyStep={sendSurveyStep}
                                        isSubmitting={isSubmitting}
                                        onBack={() => {
                                            if (currentStep === 3 && sendSurveyStep > 0) {
                                                setSendSurveyStep(sendSurveyStep - 1);
                                            } else {
                                                setCurrentStep(currentStep - 1);
                                            }
                                        }}
                                        onSaveAsDraft={async () => {
                                            await setFieldValue('submissionAction', 'draft');
                                            submitForm();
                                        }}
                                        onPublish={async () => {
                                            await setFieldValue('submissionAction', 'active');

                                            handleSurveyNextStep({
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
                                            });
                                        }}
                                        onNext={async () => {
                                            if (currentStep === 0) {
                                                await setFieldValue('submissionAction', 'draft');
                                            }

                                            handleSurveyNextStep({
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
                                            });
                                        }}
                                    />
                                </Form>
                            </>
                        );
                    }}
                </Formik>
            </div>
        </AppLayout>
    );
}
