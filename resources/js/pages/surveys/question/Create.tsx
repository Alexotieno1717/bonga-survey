import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
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
    normalizeFieldPath,
    setValueAtPath,
} from '@/components/survey/create/form-path';
import {
    handleRecipientFileUpload,
} from '@/components/survey/create/recipients';
import {
    handleSurveyNextStep,
    isSurveyCreateStep0Complete,
    isSurveyCreateStep1Complete,
} from '@/components/survey/create/step-logic';
import { buildSurveyPayload } from '@/components/survey/create/survey-payload';
import SurveyCreateFooterActions from '@/components/survey/create/SurveyCreateFooterActions';
import SurveyCreateStepContent from '@/components/survey/create/SurveyCreateStepContent';
import SurveyCreateTabs from '@/components/survey/create/SurveyCreateTabs';
import type {
    Contact,
    FormErrors,
    FormTouched,
    FormValues,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';
import {
    filterValidationErrorsByFields,
    validateSurveyCreateValues,
} from '@/components/survey/create/validation';
import AppLayout from '@/layouts/app-layout';
import questions from '@/routes/questions';

interface PageProps extends InertiaPageProps {
    contacts: Contact[];
    contactGroups?: Array<{
        id: number;
        name: string;
    }>;
    existingTriggerWords: string[];
}

const detailsStepFields = ['surveyName', 'description', 'startDate', 'endDate', 'shortCode', 'triggerWord'];

export default function Create() {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [sendSurveyStep, setSendSurveyStep] = useState<number>(0);
    const [recipientInputMode, setRecipientInputMode] = useState<'contacts' | 'upload'>('contacts');
    const [uploadedRecipientFileName, setUploadedRecipientFileName] = useState('');
    const [isParsingRecipientsFile, setIsParsingRecipientsFile] = useState(false);
    const [childQuestionStates, setChildQuestionStates] = useState<Record<string, ChildQuestionOptionState>>({});
    const [clientErrors, setClientErrors] = useState<FormErrors>({});
    const [touchedFields, setTouchedFields] = useState<FormTouched>({});

    const { contacts, existingTriggerWords } = usePage<PageProps>().props;
    const {
        data,
        errors,
        post,
        processing,
        setData,
        transform,
    } = useForm<FormValues>(surveyCreateInitialValues);

    const normalizeTriggerWord = (value: string): string => value.trim().toLowerCase();
    const isTriggerWordUnique = (value: string): boolean => {
        const normalizedValue = normalizeTriggerWord(value);

        if (normalizedValue.length === 0) {
            return false;
        }

        return !existingTriggerWords.includes(normalizedValue);
    };

    const normalizeFieldErrors = (inputErrors: Record<string, unknown>): FormErrors => {
        return Object.entries(inputErrors).reduce<FormErrors>((normalizedErrors, [field, message]) => {
            if (typeof message !== 'string') {
                return normalizedErrors;
            }

            normalizedErrors[normalizeFieldPath(field)] = message;

            return normalizedErrors;
        }, {});
    };

    const mergeStepErrors = (stepFields: string[], stepErrors: FormErrors): void => {
        const normalizedStepFields = stepFields.map((field) => normalizeFieldPath(field));

        setClientErrors((previousErrors) => {
            const nextErrors: FormErrors = {};

            Object.entries(previousErrors).forEach(([field, message]) => {
                const isStepField = normalizedStepFields.some((stepField) => {
                    return field === stepField || field.startsWith(`${stepField}.`);
                });

                if (!isStepField) {
                    nextErrors[field] = message;
                }
            });

            return {
                ...nextErrors,
                ...stepErrors,
            };
        });
    };

    const setFieldTouched: SetFieldTouched = (field, touched = true) => {
        const normalizedField = normalizeFieldPath(field);

        setTouchedFields((previousTouched) => {
            return {
                ...previousTouched,
                [normalizedField]: touched,
            };
        });
    };

    const markFieldsTouched = (fields: string[]): void => {
        const normalizedTouchedFields = fields.map((field) => normalizeFieldPath(field));

        setTouchedFields((previousTouched) => {
            const nextTouched = { ...previousTouched };

            normalizedTouchedFields.forEach((field) => {
                nextTouched[field] = true;
            });

            return nextTouched;
        });
    };

    const getFieldError = (field: string): string | undefined => {
        const normalizedField = normalizeFieldPath(field);
        const normalizedServerErrors = normalizeFieldErrors(errors as Record<string, unknown>);

        return clientErrors[normalizedField] ?? normalizedServerErrors[normalizedField];
    };

    const isFieldTouched = (field: string): boolean => {
        return Boolean(touchedFields[normalizeFieldPath(field)]);
    };

    const setFieldValue: SetFieldValue = (field, value) => {
        const normalizedField = normalizeFieldPath(field);

        setData((previousValues) => {
            return setValueAtPath(previousValues, field, value);
        });

        setClientErrors((previousErrors) => {
            if (!previousErrors[normalizedField]) {
                return previousErrors;
            }

            const nextErrors = { ...previousErrors };
            delete nextErrors[normalizedField];

            return nextErrors;
        });
    };

    const validateStep = (stepFields: string[]): boolean => {
        markFieldsTouched(stepFields);

        const allErrors = validateSurveyCreateValues(data, existingTriggerWords, surveyCreateToday);
        const stepErrors = filterValidationErrorsByFields(allErrors, stepFields);
        mergeStepErrors(stepFields, stepErrors);

        return Object.keys(stepErrors).length === 0;
    };

    const validateDetailsStep = (): boolean => {
        return validateStep(detailsStepFields);
    };

    const validateQuestionsStep = (): boolean => {
        const questionStepFields = data.questions.map((_, questionIndex) => `questions.${questionIndex}`);

        return validateStep(questionStepFields);
    };

    const submitForm = (submissionAction: FormValues['submissionAction']): void => {
        try {
            const payload = buildSurveyPayload({
                values: data,
                childQuestionStates,
                formattedStartDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : '',
                formattedEndDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : '',
                scheduleTime: data.scheduleMode === 'now'
                    ? getCurrentDateTimeLocalValue()
                    : data.scheduleTime,
                submissionAction,
            });

            transform(() => payload as unknown as FormValues);
            post(questions.store().url, {
                onSuccess: () => {
                    toast.success(
                        submissionAction === 'active'
                            ? 'Survey published successfully!'
                            : 'Survey saved as draft successfully!',
                        {
                            position: 'top-center',
                            richColors: true,
                        },
                    );
                    router.visit(questions.index().url);
                },
                onError: (validationErrors) => {
                    markFieldsTouched(Object.keys(validationErrors));
                    console.error('Validation errors:', validationErrors);
                    toast.error(
                        'Failed to create survey. Please check your inputs.',
                        {
                            position: 'top-center',
                            richColors: true,
                        },
                    );
                },
                onFinish: () => {
                    transform((previousValues) => previousValues);
                },
            });
        } catch (error) {
            console.error('Error submitting survey:', error);
            toast.error('An unexpected error occurred.', {
                position: 'top-center',
                richColors: true,
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Create Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <SurveyCreateTabs
                    currentStep={currentStep}
                    questionCount={data.questions.length}
                    isStep0Complete={isSurveyCreateStep0Complete(data, isTriggerWordUnique)}
                    isStep1Complete={isSurveyCreateStep1Complete(data)}
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

                <form
                    className="bg-white"
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                >
                    <SurveyCreateStepContent
                        currentStep={currentStep}
                        sendSurveyStep={sendSurveyStep}
                        values={data}
                        getFieldError={getFieldError}
                        isFieldTouched={isFieldTouched}
                        setFieldValue={setFieldValue}
                        setFieldTouched={setFieldTouched}
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
                        isSubmitting={processing}
                        onBack={() => {
                            if (currentStep === 3 && sendSurveyStep > 0) {
                                setSendSurveyStep(sendSurveyStep - 1);
                            } else {
                                setCurrentStep(currentStep - 1);
                            }
                        }}
                        onSaveAsDraft={async () => {
                            submitForm('draft');
                        }}
                        onPublish={async () => {
                            handleSurveyNextStep({
                                currentStep,
                                sendSurveyStep,
                                values: data,
                                validateDetailsStep,
                                validateQuestionsStep,
                                submitForm: () => submitForm('active'),
                                setCurrentStep,
                                setSendSurveyStep,
                            });
                        }}
                        onNext={async () => {
                            handleSurveyNextStep({
                                currentStep,
                                sendSurveyStep,
                                values: data,
                                validateDetailsStep,
                                validateQuestionsStep,
                                submitForm: () => submitForm('draft'),
                                setCurrentStep,
                                setSendSurveyStep,
                            });
                        }}
                    />
                </form>
            </div>
        </AppLayout>
    );
}
