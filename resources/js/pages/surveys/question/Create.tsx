import { Transition } from '@headlessui/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type {
    FormikErrors,
    FormikHelpers,
    FormikTouched,
} from 'formik';
import {
    ErrorMessage,
    Field,
    Form,
    Formik
} from 'formik';
import {
    CalendarIcon,
    Download,
    EditIcon,
    MoveLeft,
    MoveRight,
    Trash2,
    TriangleAlert,
    UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import AddContactsModal from '@/components/AddContactsModal';
import { DataTable } from '@/components/DataTable';
import DatePicker from '@/components/DatePicker';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import StepNavigation from '@/components/StepNavigation';
import { Button } from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import questions from '@/routes/questions';

interface Question {
    question: string;
    responseType: 'free-text' | 'multiple-choice';
    options: string[];
    allowMultiple?: boolean;
    freeTextDescription?: string;
    isSaved?: boolean;
    isSaving?: boolean;
    isEditing?: boolean;
    branching?: string | number | (string | number)[] | null;
}

interface Contact {
    id: number;
    names: string;
    phone: string;
    email: string;
    gender?: 'male' | 'female';
    contact_group_id?: number;
}

interface PageProps extends InertiaPageProps {
    contacts: Contact[];
    contactGroups?: Array<{
        id: number;
        name: string;
    }>;
    existingTriggerWords: string[];
}

const steps = [
    { id: 1, label: "Add Recipients" },
    { id: 2, label: "Review Recipients" },
    { id: 3, label: "Invitation" },
    { id: 4, label: "Send" },
];
const today = new Date();
today.setHours(0, 0, 0, 0);

const buildDefaultInvitationMessage = (triggerWord: string): string => {
    const normalizedTriggerWord = triggerWord.trim();

    if (normalizedTriggerWord.length === 0) {
        return '';
    }

    return `Reply with ${normalizedTriggerWord} to participate.`;
};

const getCurrentDateTimeLocalValue = (): string => {
    const now = new Date();
    const timezoneOffsetInMs = now.getTimezoneOffset() * 60 * 1000;
    const localDateTime = new Date(now.getTime() - timezoneOffsetInMs);

    return localDateTime.toISOString().slice(0, 16);
};

interface FormValues {
    submissionAction: 'draft' | 'active';
    isCompletionMessageSaved?: boolean;
    isSavingCompletionMessage?: boolean;
    surveyName: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    triggerWord: string;
    questions: Question[];
    completionMessage?: string;
    recipients: Contact[];
    recipientSelectionType: 'all' | 'select';
    selectedContactIds: number[];
    invitationMessage: string;
    scheduleMode: 'now' | 'later';
    scheduleTime: string;
}

const initialValues: FormValues = {
    submissionAction: 'active',
    surveyName: '',
    description: '',
    startDate: new Date(today),
    endDate: null,
    triggerWord: '',
    questions: [
        {
            question: '',
            responseType: 'free-text',
            options: [],
            allowMultiple: false,
            freeTextDescription: '',
            isSaved: true,
            branching: undefined,
        },
    ],
    completionMessage: '',
    isSavingCompletionMessage: false,
    recipients: [],
    recipientSelectionType: 'select',
    selectedContactIds: [],
    invitationMessage: '',
    scheduleMode: 'now',
    scheduleTime: '',
};

export default function Create() {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [sendSurveyStep, setSendSurveyStep] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recipientInputMode, setRecipientInputMode] = useState<'contacts' | 'upload'>('contacts');
    const [uploadedRecipientFileName, setUploadedRecipientFileName] = useState('');
    const [isParsingRecipientsFile, setIsParsingRecipientsFile] = useState(false);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        questionIndex: number | null;
    }>({ isOpen: false, questionIndex: null });

    const { contacts, existingTriggerWords } = usePage<PageProps>().props;

    const normalizeTriggerWord = (value: string): string => value.trim().toLowerCase();
    const isTriggerWordUnique = (value: string): boolean => {
        const normalizedValue = normalizeTriggerWord(value);

        if (normalizedValue.length === 0) {
            return false;
        }

        return !existingTriggerWords.includes(normalizedValue);
    };

    const validationSchema = Yup.object().shape({
        surveyName: Yup.string().required("Survey Name is required"),
        description: Yup.string().required("Description is required"),
        startDate: Yup.date()
            .min(today, 'Start date cannot be in the past')
            .required("Start date is required"),
        endDate: Yup.date()
            .min(Yup.ref("startDate"), "End Date must be after start date")
            .required("End date is required"),
        triggerWord: Yup.string()
            .required("Trigger word is required")
            .test(
                'unique-trigger-word',
                'This trigger word is already in use.',
                (value) => {
                    const normalizedValue = (value ?? '').trim().toLowerCase();

                    if (normalizedValue.length === 0) {
                        return true;
                    }

                    return !existingTriggerWords.includes(normalizedValue);
                },
            ),
        questions: Yup.array().of(
            Yup.object().shape({
                question: Yup.string().required("Question is required"),
                responseType: Yup.string()
                    .oneOf(["free-text", "multiple-choice"])
                    .required("Response Type is required"),
                options: Yup.array()
                    .of(Yup.string().required("Option cannot be empty"))
                    .when("responseType", {
                        is: "multiple-choice",
                        then: (schema) => schema.min(1, "At least one option is required"),
                        otherwise: (schema) => schema.notRequired(),
                    }),
                allowMultiple: Yup.boolean(),
                freeTextDescription: Yup.string().notRequired(),
            })
        ),
        completionMessage: Yup.string().notRequired(),
    });

    const handleDeleteQuestion = (
        values: FormValues,
        setFieldValue: (field: string, value: unknown) => void,
    ) => {
        if (deleteConfirmation.questionIndex !== null) {
            const newQuestions = values.questions.filter(
                (_: Question, i: number) =>
                    i !== deleteConfirmation.questionIndex,
            );

            // If it's the last question, reset it to an empty form
            if (newQuestions.length === 0) {
                setFieldValue('questions', [
                    {
                        question: '',
                        responseType: 'free-text',
                        options: [],
                        allowMultiple: false,
                        freeTextDescription: '',
                        isSaved: true,
                        isSaving: false,
                        isEditing: false,
                        branching: null,
                    },
                ]);
            } else {
                // Otherwise, delete the question
                setFieldValue('questions', newQuestions);
            }
        }

        // Close the confirmation dialog
        setDeleteConfirmation({
            isOpen: false,
            questionIndex: null,
        });
    };

    const parseRecipientFile = (fileContent: string): Contact[] => {
        const splitCsvRow = (row: string): string[] => {
            return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        };

        const normalizeCsvValue = (value: string): string => {
            const trimmedValue = value.trim();
            const withoutQuotes = trimmedValue.replace(/^"(.*)"$/, '$1');

            return withoutQuotes.replace(/""/g, '"').trim();
        };

        const rows = fileContent
            .split(/\r?\n/)
            .map((row) => row.trim())
            .filter(Boolean);

        if (rows.length === 0) {
            return [];
        }

        const normalizedHeaders = rows[0].toLowerCase();
        const hasHeader = normalizedHeaders.includes('phone') || normalizedHeaders.includes('name');
        const dataRows = hasHeader ? rows.slice(1) : rows;
        const headerColumns = hasHeader
            ? splitCsvRow(rows[0]).map((column) => normalizeCsvValue(column).toLowerCase())
            : [];

        const nameIndex = headerColumns.findIndex((column) => ['name', 'names', 'full_name'].includes(column));
        const phoneIndex = headerColumns.findIndex((column) => ['phone', 'phone_number', 'number', 'mobile'].includes(column));
        const emailIndex = headerColumns.findIndex((column) => ['email', 'email_address'].includes(column));

        const recipients = dataRows
            .map((row, index) => {
                const columns = splitCsvRow(row).map((column) => normalizeCsvValue(column));

                const phone = hasHeader
                    ? (phoneIndex >= 0 ? (columns[phoneIndex] || '') : '')
                    : (columns.length === 1 ? columns[0] : (columns[1] || columns[0] || ''));

                if (!phone) {
                    return null;
                }

                const names = hasHeader
                    ? (nameIndex >= 0 ? (columns[nameIndex] || `Recipient ${index + 1}`) : `Recipient ${index + 1}`)
                    : (columns.length === 1 ? `Recipient ${index + 1}` : (columns[0] || `Recipient ${index + 1}`));

                const email = hasHeader
                    ? (emailIndex >= 0 ? (columns[emailIndex] || '') : '')
                    : (columns[2] || '');

                return {
                    id: Date.now() + index,
                    names,
                    phone,
                    email,
                } as Contact;
            })
            .filter((recipient): recipient is Contact => recipient !== null);

        const uniqueByPhone = recipients.filter((recipient, index, allRecipients) => {
            return allRecipients.findIndex((item) => item.phone === recipient.phone) === index;
        });

        return uniqueByPhone;
    };

    const handleRecipientFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        setFieldValue: (field: string, value: unknown) => void,
    ): Promise<void> => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsParsingRecipientsFile(true);

        try {
            const fileContent = await file.text();
            const parsedRecipients = parseRecipientFile(fileContent);

            if (parsedRecipients.length === 0) {
                toast.error('No valid recipients were found in the uploaded file.');
                return;
            }

            setFieldValue('recipientSelectionType', 'select');
            setFieldValue('recipients', parsedRecipients);
            setFieldValue('selectedContactIds', parsedRecipients.map((recipient) => Number(recipient.id)));
            setUploadedRecipientFileName(file.name);

            toast.success(`${parsedRecipients.length} recipients uploaded successfully.`);
        } catch {
            toast.error('Failed to process file. Please use a valid CSV or TXT file.');
        } finally {
            setIsParsingRecipientsFile(false);
            event.target.value = '';
        }
    };

    function renderForm(
        touched: FormikTouched<FormValues>,
        errors: FormikErrors<FormValues>,
        values: FormValues,
        setFieldValue: (field: string, value: unknown) => void,
    ) {
        switch (currentStep) {
            case 0: // Survey Details
                return (
                    <>
                        <div className='space-y-6'>
                            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                <h1 className="text-lg font-semibold text-slate-900">Create Survey</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Set survey details, timeline, and trigger word before adding questions.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Survey Name</label>
                                        <Field
                                            name="surveyName"
                                            type="text"
                                            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            placeholder="Enter survey title"
                                        />
                                        {errors.surveyName && touched.surveyName ? (
                                            <span id="surveyName" className="text-sm text-red-500">
                                                <ErrorMessage id="surveyName" name="surveyName" />
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Description</label>
                                        <Field
                                            name="description"
                                            as="textarea"
                                            className="min-h-[110px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            placeholder="Write a short description of this survey"
                                        />
                                        {errors.description && touched.description ? (
                                            <span id="description" className="text-sm text-red-500">
                                                <ErrorMessage id="description" name="description" />
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Start Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50",
                                                            !values.startDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {values.startDate ? (
                                                            format(values.startDate, "PPP")
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
                                            {errors.startDate && touched.startDate ? (
                                                <span id="startDate" className="text-sm text-red-500">
                                                    <ErrorMessage id="startDate" name="startDate" />
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">End Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-11 w-full rounded-lg border-slate-200 pl-3 text-left font-normal hover:bg-slate-50",
                                                            !values.endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {values.endDate ? (
                                                            format(values.endDate, "PPP")
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
                                            {errors.endDate && touched.endDate ? (
                                                <span id="endDate" className="text-sm text-red-500">
                                                    <ErrorMessage id="endDate" name="endDate" />
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Trigger Word</label>
                                    <Field
                                        type="text"
                                        name="triggerWord"
                                        placeholder="Enter trigger word"
                                        cols={30}
                                        rows={5}
                                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                                    {errors.triggerWord && touched.triggerWord ? (
                                        <span id="triggerWord" className="text-sm text-red-500">
                                            <ErrorMessage id="triggerWord" name="triggerWord" />
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 1: // Questions
                return (
                    <>
                        <div className='space-y-6'>
                            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                <h1 className="text-lg font-semibold text-slate-900">Create Questions</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Design your survey flow by defining each question and where participants go next.
                                </p>
                            </div>

                            {values.questions.map((question: Question, index: number) => (
                                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                                {index + 1}
                                            </span>
                                            <h2 className="text-base font-semibold text-slate-900">Question {index + 1}</h2>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                            {question.responseType === 'multiple-choice' ? 'Multiple choice' : 'Free text'}
                                        </span>
                                    </div>

                                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                                        <div className='space-y-1.5'>
                                            <label className="block text-sm font-medium text-slate-700">
                                                Question Text
                                            </label>
                                            <Field
                                                name={`questions[${index}].question`}
                                                type="text"
                                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                placeholder="Enter your question"
                                                onFocus={() => {
                                                    if (question.isSaved) {
                                                        setFieldValue(`questions[${index}].isEditing`, true);
                                                    }
                                                }}
                                            />
                                            <span className="text-sm text-red-500">
                                                <ErrorMessage name={`questions[${index}].question`} />
                                            </span>
                                        </div>

                                        <div className='space-y-1.5'>
                                            <label className="block text-sm font-medium text-slate-700">Response Type</label>
                                            <Field
                                                name={`questions[${index}].responseType`}
                                                as="select"
                                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                onFocus={() => {
                                                    if (question.isSaved) {
                                                        setFieldValue(`questions[${index}].isEditing`, true);
                                                    }
                                                }}
                                            >
                                                <option value="free-text">Free Text</option>
                                                <option value="multiple-choice">Multiple Choice</option>
                                            </Field>
                                            <span className="text-sm text-red-500">
                                                <ErrorMessage name={`questions[${index}].responseType`} />
                                            </span>
                                        </div>
                                    </div>

                                    {question.responseType === "multiple-choice" && (
                                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="text-sm font-medium text-slate-700">Options</label>
                                                <Button
                                                    type="button"
                                                    variant='outline'
                                                    onClick={() => {
                                                        const newOptions = [...question.options, ""];
                                                        setFieldValue(`questions[${index}].options`, newOptions);
                                                    }}
                                                    className="h-9 border-blue-300 bg-white text-blue-600 hover:bg-blue-50"
                                                >
                                                    Add Option
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {question.options.map((option: string, optionIndex: number) => (
                                                    <div key={optionIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                                                        <div className='mb-2 flex items-center justify-between'>
                                                            <span className="text-sm font-medium text-slate-700">Label {optionIndex + 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newOptions = question.options.filter((_, i: number) => i !== optionIndex);
                                                                    setFieldValue(`questions[${index}].options`, newOptions);
                                                                }}
                                                                className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700"
                                                            >
                                                                <span className="text-base">×</span>
                                                                <span>Remove</span>
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <Field
                                                                name={`questions[${index}].options[${optionIndex}]`}
                                                                type="text"
                                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                                placeholder={`Option ${optionIndex + 1}`}
                                                            />
                                                            <div className="space-y-1.5">
                                                                <label className="block text-xs font-medium text-slate-600">After child questions, go to:</label>
                                                                <Field
                                                                    as="select"
                                                                    name={`questions[${index}].branching[${optionIndex}]`}
                                                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                                >
                                                                    <option value="0" disabled className="text-gray-400">
                                                                        Next Question, if added
                                                                    </option>
                                                                    {values.questions.map((q: Question, qIndex: number) => (
                                                                        qIndex !== index && (
                                                                            <option key={qIndex} value={qIndex}>
                                                                                Question {qIndex + 1}
                                                                            </option>
                                                                        )
                                                                    ))}
                                                                    <option className="disabled:cursor-not-allowed" value="-2" disabled={true}>
                                                                        -- No More Options --
                                                                    </option>
                                                                    <option value="-1">End Survey</option>
                                                                </Field>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex items-center space-x-2">
                                                <Field
                                                    type="checkbox"
                                                    name={`questions[${index}].allowMultiple`}
                                                    id={`allowMultiple-${index}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                />
                                                <label htmlFor={`allowMultiple-${index}`} className="text-sm font-medium text-slate-700">
                                                    Allow participant to pick more than one option
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {question.responseType === "free-text" && (
                                        <div className='mt-5 space-y-1.5'>
                                            <label className="block text-sm font-medium text-slate-700">Explanation (Optional)</label>
                                            <textarea
                                                value=""
                                                readOnly
                                                disabled
                                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                                                placeholder="Participants will give an open-ended answer..."
                                            />
                                        </div>
                                    )}

                                    <div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">After answer has been submitted, go to:</label>
                                        <Field
                                            as="select"
                                            name={`questions[${index}].branching`}
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        >
                                            <option value="0" disabled className="text-gray-400">
                                                Next Question, if added
                                            </option>
                                            {values.questions.map((q: Question, qIndex: number) => (
                                                qIndex !== index && (
                                                    <option key={qIndex} value={qIndex}>
                                                        Question {qIndex + 1}
                                                    </option>
                                                )
                                            ))}
                                            <option className="disabled:cursor-not-allowed" value="-2" disabled={true}>
                                                -- No questions --
                                            </option>
                                            <option value="-1">End Survey</option>
                                        </Field>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-slate-500">{question.question?.length || 0} characters</p>
                                        <div className="flex items-center gap-3">
                                            {(question.isEditing || !question.isSaved) && (
                                                <div className="flex items-center space-x-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                                                    <TriangleAlert className="h-4 w-4 text-amber-600" />
                                                    <span className={`text-xs ${question.isSaving ? 'text-amber-700' : 'text-red-600'}`}>
                                                        {question.isSaving ? "Saving Question..." : "Question Not Saved"}
                                                    </span>
                                                </div>
                                            )}

                                            {(question.isEditing || !question.isSaved) && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={async () => {
                                                        if (!question.question) {
                                                            setFieldValue(`questions[${index}].isEditing`, true);
                                                            return;
                                                        }

                                                        setFieldValue(`questions[${index}].isSaving`, true);
                                                        await new Promise((resolve) => setTimeout(resolve, 1000));
                                                        setFieldValue(`questions[${index}].isSaving`, false);
                                                        setFieldValue(`questions[${index}].isSaved`, true);
                                                        setFieldValue(`questions[${index}].isEditing`, false);
                                                    }}
                                                    className="h-9"
                                                >
                                                    Save Question
                                                </Button>
                                            )}

                                            {question.isSaved && !question.isEditing && (
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-slate-300 p-2 text-slate-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => {
                                                        setDeleteConfirmation({
                                                            isOpen: true,
                                                            questionIndex: index,
                                                        });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className='flex items-center justify-end'>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const newQuestion = {
                                            question: '',
                                            responseType: "free-text",
                                            options: [],
                                            allowMultiple: false,
                                            freeTextDescription: '',
                                            isSaved: true,
                                            isSaving: false,
                                            isEditing: false,
                                            branching: null
                                        };
                                        setFieldValue("questions", [...values.questions, newQuestion]);
                                    }}
                                    className="h-10 px-5"
                                >
                                    Add New Question
                                </Button>
                            </div>
                        </div>

                        <DeleteConfirmationDialog
                            isOpen={deleteConfirmation.isOpen}
                            onConfirm={() => handleDeleteQuestion(values, setFieldValue)}
                            onCancel={() => setDeleteConfirmation({
                                isOpen: false,
                                questionIndex: null,
                            })}
                        />
                    </>
                );

            case 2: // Survey Outro
                return (
                    <>
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                <h1 className="text-lg font-semibold text-slate-900">Compose a survey completion message (optional)</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    This message will be sent to participants after they answer their last question.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">Completion Message</label>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                        {values.completionMessage?.length || 0} chars
                                    </span>
                                </div>

                                <Field
                                    as="textarea"
                                    name="completionMessage"
                                    placeholder="E.g. Thank you for taking the time to complete our survey! Your feedback is invaluable to us and helps us improve."
                                    className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                    rows={4}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                        if (values.isCompletionMessageSaved) {
                                            setFieldValue("isCompletionMessageSaved", false);
                                        }
                                        setFieldValue("completionMessage", e.target.value);
                                    }}
                                />
                                <ErrorMessage name="completionMessage" component="div" className="pt-2 text-xs text-red-500" />

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-slate-500">
                                        Leave empty if you do not want to send a completion SMS.
                                    </p>
                                    <Button
                                        type="button"
                                        variant={(values.isCompletionMessageSaved ? "secondary" : "default") as | "default" | "secondary"}
                                        onClick={async () => {
                                            if (!values.completionMessage) {
                                                return;
                                            }

                                            setFieldValue("isSavingCompletionMessage", true);
                                            await new Promise((resolve) => setTimeout(resolve, 1000));
                                            setFieldValue("isSavingCompletionMessage", false);
                                            setFieldValue("isCompletionMessageSaved", true);
                                        }}
                                        disabled={values.isCompletionMessageSaved || !values.completionMessage}
                                    >
                                        {values.isSavingCompletionMessage ? "Saving..." : "Save Message"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 3: // Send Survey
                switch (sendSurveyStep) {

                    case 0: // Add Recipients
                        return (
                            <div className="space-y-6">
                                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                                    <h1 className="text-lg font-semibold text-slate-900">Add Survey Participants</h1>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Choose how you want to add recipients and select who should receive this survey.
                                    </p>

                                    <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setRecipientInputMode('contacts')}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                                recipientInputMode === 'contacts'
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Select contacts
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRecipientInputMode('upload')}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                                recipientInputMode === 'upload'
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Upload file
                                        </button>
                                    </div>
                                </div>

                                {recipientInputMode === 'contacts' && (
                                    <>
                                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                                            <label className="mb-3 block text-sm font-medium text-slate-700">
                                                Select Survey Participants from your contacts list
                                            </label>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <label
                                                    className={`cursor-pointer rounded-lg border p-3 transition ${
                                                        values.recipientSelectionType === 'all'
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Field
                                                            type="radio"
                                                            name="recipientSelectionType"
                                                            value="all"
                                                            className="form-radio"
                                                            onChange={() => {
                                                                setFieldValue('recipientSelectionType', 'all');
                                                                setFieldValue('recipients', contacts);
                                                                setFieldValue('selectedContactIds', contacts.map(c => Number(c.id)));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-800">
                                                            All contacts ({contacts.length || 0})
                                                        </span>
                                                    </div>
                                                </label>

                                                <label
                                                    className={`cursor-pointer rounded-lg border p-3 transition ${
                                                        values.recipientSelectionType === 'select'
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Field
                                                            type="radio"
                                                            name="recipientSelectionType"
                                                            value="select"
                                                            className="form-radio"
                                                            onChange={() => {
                                                                setFieldValue('recipientSelectionType', 'select');
                                                                setFieldValue('recipients', []);
                                                                setFieldValue('selectedContactIds', []);
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-slate-800">
                                                            Select survey participants
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {values.recipientSelectionType === 'select' && (
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900">Select Contacts</h3>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                                        Selected: {values.recipients.length}
                                                    </span>
                                                </div>

                                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                                                <input
                                                                    type="checkbox"
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setFieldValue('recipients', contacts);
                                                                            setFieldValue('selectedContactIds', contacts.map(c => Number(c.id)));
                                                                        } else {
                                                                            setFieldValue('recipients', []);
                                                                            setFieldValue('selectedContactIds', []);
                                                                        }
                                                                    }}
                                                                    checked={values.recipients.length === contacts.length && contacts.length > 0}
                                                                />
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {contacts.map((contact) => (
                                                            <tr key={contact.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                                <td className="px-4 py-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={values.recipients.some(r => r.id === contact.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setFieldValue('recipients', [...values.recipients, contact]);
                                                                                setFieldValue('selectedContactIds', [
                                                                                    ...values.selectedContactIds,
                                                                                    Number(contact.id)
                                                                                ]);
                                                                            } else {
                                                                                setFieldValue(
                                                                                    'recipients',
                                                                                    values.recipients.filter(r => r.id !== contact.id)
                                                                                );
                                                                                setFieldValue(
                                                                                    'selectedContactIds',
                                                                                    values.selectedContactIds.filter(id => id !== Number(contact.id))
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-slate-800">{contact.names}</td>
                                                                <td className="px-4 py-2 text-sm text-slate-700">{contact.phone}</td>
                                                                <td className="px-4 py-2 text-sm text-slate-700">{contact.email || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {recipientInputMode === 'upload' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-slate-900">Upload Recipients File</h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Upload a `.csv` or `.txt` file with recipient data.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">Recipient file</label>
                                                <input
                                                    type="file"
                                                    accept=".csv,.txt"
                                                    onChange={(event) => handleRecipientFileUpload(event, setFieldValue)}
                                                    className="block h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isParsingRecipientsFile}
                                                className="h-11 border-slate-200 bg-white hover:bg-slate-100"
                                            >
                                                {isParsingRecipientsFile ? 'Processing...' : 'Import Recipients'}
                                            </Button>
                                        </div>

                                        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                            Expected columns: `name`, `phone`, `email` (header optional). One recipient per line.
                                        </div>

                                        {uploadedRecipientFileName && (
                                            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                                Uploaded file: <span className="font-medium">{uploadedRecipientFileName}</span>
                                            </div>
                                        )}

                                        {values.recipients.length > 0 && (
                                            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                    Imported recipients ({values.recipients.length})
                                                </div>
                                                <table className="w-full">
                                                    <thead className="bg-white">
                                                    <tr className="border-b border-slate-100">
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {values.recipients.slice(0, 8).map((recipient) => (
                                                        <tr key={recipient.id} className="border-b border-slate-100 text-sm last:border-0">
                                                            <td className="px-4 py-2 text-slate-800">{recipient.names}</td>
                                                            <td className="px-4 py-2 text-slate-700">{recipient.phone}</td>
                                                            <td className="px-4 py-2 text-slate-700">{recipient.email || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );

                    case 1: { // Review Recipients
                        const reviewRecipientColumns: ColumnDef<Contact>[] = [
                            {
                                accessorKey: 'phone',
                                header: 'Number',
                                cell: ({ row }) => (
                                    <span className="font-medium text-blue-600">{row.original.phone}</span>
                                ),
                            },
                            {
                                accessorKey: 'names',
                                header: 'Name',
                            },
                            {
                                id: 'actions',
                                header: 'Actions',
                                cell: ({ row }) => (
                                    <div className="flex items-center space-x-2">
                                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                                            <EditIcon className='h-4 w-4' />
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                                            onClick={() => {
                                                setFieldValue(
                                                    'recipients',
                                                    values.recipients.filter((recipient: Contact) => recipient.id !== row.original.id)
                                                );
                                            }}
                                        >
                                            <Trash2 className='h-4 w-4' />
                                        </button>
                                    </div>
                                ),
                                enableSorting: false,
                                enableHiding: false,
                            },
                        ];

                        return (
                            <div className='space-y-6'>
                                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                    <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
                                        <div className='space-y-1'>
                                            <h1 className="text-lg font-semibold text-slate-900">
                                                Review Recipients
                                            </h1>
                                            <p className='text-sm text-slate-500'>
                                                Kindly review the recipients and rectify the ones that need fixing.
                                            </p>
                                        </div>

                                        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
                                            <Field
                                                name='search'
                                                type="text"
                                                className="h-10 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                placeholder="Search for recipient"
                                            />

                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex items-center justify-center space-x-2 border border-[#E3E5EB] bg-transparent text-gray-400 shadow-sm hover:bg-transparent hover:text-gray-400 hover:shadow-md focus:outline-none"
                                            >
                                                <Trash2 className='h-4 w-4' />
                                                <span>Delete</span>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsModalOpen(true)}
                                                className="flex items-center justify-center space-x-2 border border-blue-500 bg-transparent text-blue-500 shadow-sm hover:bg-transparent hover:text-blue-500 hover:shadow-md focus:outline-none"
                                            >
                                                <UserPlus className='h-4 w-4' />
                                                <span>Add New Recipient</span>
                                            </Button>

                                            <AddContactsModal
                                                isOpen={isModalOpen}
                                                onClose={() => setIsModalOpen(false)}
                                                onAddRecipient={(newRecipient) => {
                                                    const newContact: Contact = {
                                                        id: Date.now(),
                                                        names: newRecipient.name,
                                                        phone: newRecipient.phone,
                                                        email: newRecipient.email || '',
                                                    };

                                                    setFieldValue('recipients', [...values.recipients, newContact]);
                                                    setIsModalOpen(false);

                                                    toast.success('Recipient added successfully!');
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <DataTable<Contact>
                                        columns={reviewRecipientColumns}
                                        data={values.recipients}
                                        filterColumn="names"
                                        pageSize={10}
                                    />
                                </div>

                                {values.recipients.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm text-slate-500">
                                        No recipients selected. Please go back and select recipients.
                                    </div>
                                )}

                            </div>
                        );
                    }

                    case 2: // Invitation
                        return (
                            <div className='space-y-6'>
                                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                    <h1 className="text-lg font-semibold text-slate-900">Compose Invitation</h1>
                                    <p className='mt-1 text-sm text-slate-500'>
                                        Compose an invitation message for opting into your survey and schedule when it should be sent.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">Invitation Message</label>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                            {values.invitationMessage.length || 0} chars
                                        </span>
                                    </div>
                                    <Field
                                        as="textarea"
                                        name="invitationMessage"
                                        className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        rows={4}
                                        placeholder="Reply with START to participate"
                                    />

                                    <div className='mt-4 space-y-2 text-xs text-slate-500'>
                                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            This message contains the following additional characters for Safaricom recipients:
                                            {' '}
                                            STOP*456*9*5#
                                        </p>
                                        <p>
                                            {values.invitationMessage.length || 0} characters 1 message(s) . GSM 7 Encoding
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                    <label className="block text-sm font-medium text-slate-700">Schedule Time</label>
                                    <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                        <button
                                            type="button"
                                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                                values.scheduleMode === 'now'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
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
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                            onClick={() => {
                                                setFieldValue('scheduleMode', 'later');
                                                setFieldValue('scheduleTime', '');
                                            }}
                                        >
                                            Schedule for Later
                                        </button>
                                    </div>

                                    <Field
                                        type="datetime-local"
                                        name="scheduleTime"
                                        disabled={values.scheduleMode === 'now'}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        value={
                                            values.scheduleMode === 'now'
                                                ? getCurrentDateTimeLocalValue()
                                                : values.scheduleTime
                                        }
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            setFieldValue('scheduleTime', event.target.value);
                                        }}
                                    />
                                    {values.scheduleMode === 'now' ? (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Survey will be sent immediately after publish.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        );

                    case 3: { // Send
                        const sendRows = values.recipients.map((recipient: Contact) => ({
                            id: recipient.id,
                            message: values.invitationMessage || 'Reply with START to participate STOP*000*2*1#',
                            number: recipient.phone,
                            msgCount: 1,
                            name: recipient.names,
                        }));

                        const reviewSendColumns: ColumnDef<(typeof sendRows)[number]>[] = [
                            {
                                accessorKey: 'message',
                                header: 'Message',
                                cell: ({ row }) => (
                                    <span className="font-medium text-blue-600">{row.original.message}</span>
                                ),
                            },
                            {
                                accessorKey: 'number',
                                header: 'Number',
                                cell: ({ row }) => (
                                    <span className="text-blue-600">{row.original.number}</span>
                                ),
                            },
                            {
                                accessorKey: 'msgCount',
                                header: 'Msg Count',
                                cell: ({ row }) => (
                                    <span className="text-blue-600">{row.original.msgCount}</span>
                                ),
                            },
                            {
                                accessorKey: 'name',
                                header: 'Name',
                            },
                            {
                                id: 'actions',
                                header: 'Actions',
                                cell: () => (
                                    <div className="flex items-center space-x-2">
                                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                                            <EditIcon className='h-4 w-4' />
                                        </button>
                                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                                            <Trash2 className='h-4 w-4' />
                                        </button>
                                    </div>
                                ),
                                enableSorting: false,
                                enableHiding: false,
                            },
                        ];

                        return (
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
                                    <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
                                        <div className='space-y-1'>
                                            <h1 className="text-lg font-semibold text-slate-900">Review and Send</h1>
                                            <p className='text-sm text-slate-500'>Kindly review the invitation message.</p>
                                        </div>

                                        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
                                            <Field
                                                name='search'
                                                type="text"
                                                className="h-10 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                placeholder="Search for Messages"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex items-center justify-center space-x-2 border border-[#E3E5EB] bg-transparent text-gray-400 shadow-sm hover:bg-transparent hover:text-gray-400 hover:shadow-md focus:outline-none"
                                            >
                                                <Trash2 className='h-4 w-4' />
                                                <span>Delete</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex items-center justify-center space-x-2 border border-blue-500 bg-transparent text-blue-500 shadow-sm hover:bg-transparent hover:text-blue-500 hover:shadow-md focus:outline-none"
                                            >
                                                <Download className='h-4 w-4' />
                                                <span>Download CSV</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Message Preview</p>
                                    <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        {values.invitationMessage || 'Reply with START to participate'}
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <DataTable<(typeof sendRows)[number]>
                                        columns={reviewSendColumns}
                                        data={sendRows}
                                        filterColumn="message"
                                        pageSize={10}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex items-center justify-center space-x-2 border border-red-400 bg-transparent text-red-400 shadow-sm hover:bg-transparent hover:text-red-400 hover:shadow-md focus:outline-none"
                                    >
                                        <Trash2 className='h-4 w-4' />
                                        <span>Discard</span>
                                    </Button>
                                </div>
                            </div>
                        );
                    }

                    default:
                        return null;
                }

            default:
                return null;
        }
    }

    // In your handleSubmit function, update the questions mapping:
    const handleSubmit = async (
        values: FormValues,
        { setSubmitting }: FormikHelpers<FormValues>,
    ) => {
        try {
            // Transform the data to match the backend expectations
            const surveyData = {
                status: values.submissionAction,
                surveyName: values.surveyName,
                description: values.description,
                startDate: values.startDate ? format(values.startDate, 'yyyy-MM-dd') : '',
                endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : '',
                triggerWord: values.triggerWord,
                completionMessage: values.completionMessage,
                invitationMessage: values.invitationMessage,
                scheduleTime: values.scheduleMode === 'now'
                    ? getCurrentDateTimeLocalValue()
                    : values.scheduleTime,
                questions: values.questions.map((q) => {
                    // Ensure branching is always an array or null
                    let branching = q.branching;

                    // If branching is not an array, convert it or set to null
                    if (branching && !Array.isArray(branching)) {
                        // If it's a single value, wrap it in an array
                        branching = [branching];
                    } else if (!branching) {
                        branching = null;
                    }

                    return {
                        question: q.question,
                        responseType: q.responseType,
                        options: q.options || [],
                        allowMultiple: q.allowMultiple || false,
                        freeTextDescription: q.freeTextDescription,
                        branching: branching, // This will be an array or null
                    };
                }),
                recipients: values.recipients.map((r) => ({
                    id: r.id,
                    names: r.names,
                    phone: r.phone,
                    email: r.email,
                    gender: r.gender,
                    contact_group_id: r.contact_group_id,
                })),
            };

            // Submit using Inertia
            router.post(questions.store().url, surveyData, {
                onSuccess: () => {
                    toast.success(
                        values.submissionAction === 'active'
                            ? 'Survey published successfully!'
                            : 'Survey saved as draft successfully!',
                        {
                        position: 'top-center',
                        richColors: true,
                    });
                    router.visit(questions.index().url);
                },
                onError: (validationErrors) => {
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
                    setSubmitting(false);
                },
            });
        } catch (error) {
            console.error('Error submitting survey:', error);
            toast.error('An unexpected error occurred.', {
                position: "top-center",
                richColors: true
            });
            setSubmitting(false);
        }
    };

    function handleNextStep(
        values: FormValues,
        validateField: (
            field: string,
        ) => Promise<void> | Promise<string | undefined>,
        setTouched: (
            touched: FormikTouched<FormValues>,
            shouldValidate?: boolean,
        ) => Promise<void | FormikErrors<FormValues>>,
        errors: FormikErrors<FormValues>,
        submitForm: () => Promise<void>,
    ) {
        switch (currentStep) {
            case 0:
                if (
                    currentStep === 0 &&
                    (!values.surveyName ||
                        !values.description ||
                        !values.startDate ||
                        !values.endDate ||
                        !values.triggerWord ||
                        !isTriggerWordUnique(values.triggerWord))
                ) {
                    validateField('surveyName');
                    validateField('description');
                    validateField('startDate');
                    validateField('endDate');
                    validateField('triggerWord');
                    setTouched(
                        {
                            surveyName: true,
                            description: true,
                            startDate: true,
                            endDate: true,
                            triggerWord: true,
                        },
                        true,
                    );
                } else if (
                    currentStep === 0 &&
                    !errors.surveyName &&
                    !errors.description &&
                    !errors.startDate &&
                    !errors.endDate &&
                    !errors.triggerWord &&
                    isTriggerWordUnique(values.triggerWord)
                ) {
                    setCurrentStep(currentStep + 1);
                }
                break;

            case 1:
                if (
                    currentStep === 1 &&
                    values.questions.some(
                        (question: {
                            question: string;
                            responseType: 'free-text' | 'multiple-choice';
                            options: string[];
                        }) =>
                            !question.question ||
                            !question.responseType ||
                            (question.responseType === 'multiple-choice' && question.options.length === 0),
                    )
                ) {
                    values.questions.forEach((_: Question, index: number) => {
                        validateField(`questions[${index}].question`);
                        validateField(`questions[${index}].responseType`);
                    });
                    setTouched({
                        questions: values.questions.map(() => ({
                            question: true,
                            responseType: true,
                        })),
                    });
                } else if (currentStep === 1 && !errors.questions) {
                    setCurrentStep(currentStep + 1);
                }
                break;

            case 2:
                if (
                    values.completionMessage &&
                    !values.isCompletionMessageSaved
                ) {
                    // Prevent moving to the next step if the completion message is not saved
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
                    // Validate that recipients are selected before moving to next step
                    if (sendSurveyStep === 0 && values.recipients.length === 0) {
                        toast.error('Please select at least one recipient.', {
                            position: 'top-center',
                            richColors: true,
                        });
                        return;
                    }
                    setSendSurveyStep(sendSurveyStep + 1);
                } else {
                    // Validate all required fields before final submission
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
    }

    const isStep0Complete = (values: FormValues): boolean => {
        return Boolean(
            values.surveyName &&
                values.description &&
                values.startDate &&
                values.endDate &&
                values.triggerWord &&
                isTriggerWordUnique(values.triggerWord),
        );
    };

    const isStep1Complete = (values: FormValues): boolean => {
        return values.questions.every(
            (question: Question) =>
                question.question &&
                question.responseType &&
                (question.responseType === "free-text" || question.options.length > 0),
        );
    };

    const isStep2Complete = (): boolean => {
        return true;
    };


    return (
        <AppLayout>
            <Head title="Create Surveys Questions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Formik
                    initialValues={initialValues}
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
                    }) => (
                        <>
                            <div className="inline-flex h-9 items-center rounded-lg bg-muted text-muted-foreground">
                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 0
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-500'
                                    }`}
                                >
                                    Survey Details
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 1
                                            ? 'bg-blue-500 text-white'
                                            : isStep0Complete(values)
                                              ? 'bg-white text-gray-500'
                                              : 'text-gray-400'
                                    }`}
                                >
                                    Questions ({values.questions.length})
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 2
                                            ? 'bg-blue-500 text-white'
                                            : isStep1Complete(values)
                                              ? 'bg-white text-gray-500'
                                              : 'text-gray-400'
                                    }`}
                                >
                                    Survey Outro
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 3
                                            ? 'bg-blue-500 text-white'
                                            : isStep2Complete()
                                              ? 'bg-white text-gray-500'
                                              : 'text-gray-400'
                                    }`}
                                >
                                    Send Survey
                                </div>
                            </div>

                            {currentStep === 3 && (
                                <StepNavigation
                                    steps={steps}
                                    currentStep={sendSurveyStep}
                                    onStepClick={(step) =>
                                        setSendSurveyStep(step)
                                    }
                                />
                            )}

                            <Form className="bg-white">
                                {renderForm(
                                    touched,
                                    errors,
                                    values,
                                    setFieldValue,
                                )}
                                <div className="py-6">
                                    <Transition
                                        as="div"
                                        show={true}
                                        enter="transition-opacity duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="transition-opacity duration-150"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="flex justify-end gap-x-4">
                                            {currentStep > 0 && (
                                                <Button
                                                    type="button"
                                                    className="space-x-2"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (
                                                            currentStep === 3 &&
                                                            sendSurveyStep > 0
                                                        ) {
                                                            setSendSurveyStep(
                                                                sendSurveyStep -
                                                                    1,
                                                            );
                                                        } else {
                                                            setCurrentStep(
                                                                currentStep - 1,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <MoveLeft />
                                                    <span>Back</span>
                                                </Button>
                                            )}
                                            {currentStep === 3 && sendSurveyStep === 3 ? (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-auto space-x-2 rounded-lg px-6 py-3 text-base font-semibold"
                                                        onClick={async () => {
                                                            await setFieldValue('submissionAction', 'draft');
                                                            submitForm();
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? 'Saving...' : 'Save as Draft'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="default"
                                                        className="w-auto space-x-2 rounded-lg border border-transparent px-6 py-3 text-base font-semibold shadow-sm focus:outline-none"
                                                        onClick={async () => {
                                                            await setFieldValue('submissionAction', 'active');

                                                            handleNextStep(
                                                                values,
                                                                validateField,
                                                                setTouched,
                                                                errors,
                                                                submitForm,
                                                            );
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? 'Publishing...' : 'Publish Survey'}
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    className="w-auto space-x-2 rounded-lg border border-transparent px-6 py-3 text-base font-semibold shadow-sm focus:outline-none"
                                                    onClick={() =>
                                                        handleNextStep(
                                                            values,
                                                            validateField,
                                                            setTouched,
                                                            errors,
                                                            submitForm,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <span>Next</span>
                                                    <MoveRight />
                                                </Button>
                                            )}
                                        </div>
                                    </Transition>
                                </div>
                            </Form>
                        </>
                    )}
                </Formik>
            </div>
        </AppLayout>
    );
}
