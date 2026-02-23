import { Transition } from '@headlessui/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import type {
    FormikErrors,
    FormikHelpers,
    FormikTouched,
    FormikValues,
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
import { useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import AddContactsModal from '@/components/AddContactsModal';
import DatePicker from '@/components/DatePicker';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import StepNavigation from '@/components/StepNavigation';
import { Button } from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Question {
    question: string;
    responseType: "free-text" | "multiple-choice";
    options: string[];
    allowMultiple?: boolean;
    freeTextDescription?: string;
    isSaved?: boolean;
    isSaving?: boolean;
    isEditing?: boolean;
    branching?: string | number | (string | number)[] | null; // Accept various types
}

interface Contact {
    id: string;
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
}

const steps = [
    { id: 1, label: "Add Recipients" },
    { id: 2, label: "Review Recipients" },
    { id: 3, label: "Invitation" },
    { id: 4, label: "Send" },
];

interface FormValues {
    isCompletionMessageSaved?: boolean;
    surveyName: string;
    description: string;
    startDate: string;
    endDate: string;
    triggerWord: string;
    questions: Question[];
    completionMessage?: string;
    recipients: Contact[]; // This should always be an array
    recipientSelectionType: 'all' | 'select'; // Add this to track radio selection
    selectedContactIds: number[]; // Add this to track selected contacts
    invitationMessage: string;
    scheduleTime: string;
}

const initialValues: FormValues = {
    surveyName: '',
    description: '',
    startDate: '',
    endDate: '',
    triggerWord: '',
    questions: [
        {
            question: '',
            responseType: 'free-text',
            options: [],
            allowMultiple: false,
            freeTextDescription: '',
            branching: undefined,
        },
    ],
    completionMessage: '',
    recipients: [], // Initialize as empty array
    recipientSelectionType: 'select', // Default to 'select'
    selectedContactIds: [], // Initialize empty selected contacts
    invitationMessage: '',
    scheduleTime: '',
};

const validationSchema = Yup.object().shape({
    surveyName: Yup.string().required("Survey Name is required"),
    description: Yup.string().required("Description is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
        .min(Yup.ref("startDate"), "End Date must be after start date")
        .required("End date is required"),
    triggerWord: Yup.string().required("Trigger word is required"),
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

export default function Create() {
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | number>(0); // 0: Survey Details, 1: Questions, 2: Survey Outro, 3: Send Survey
    const [sendSurveyStep, setSendSurveyStep] = useState<
        0 | 1 | 2 | 3 | number
    >(0); // 0: Add Recipients, 1: Review Recipients, 2: Invitation, 3: Send
    const [isDisabled, setDisabled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        questionIndex: number | null;
    }>({ isOpen: false, questionIndex: null, });

    const { contacts } = usePage<PageProps>().props;

    console.log(contacts)

    // const handleFormStep = (step: number) => {
    //     if (step < 4) {
    //         setCurrentStep(step);
    //     }
    // }

    const handleDeleteQuestion = (
        values: FormikValues,
        setFieldValue: (field: string, value: any) => void,
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
                        isSaved: false,
                        isSaving: false,
                        isEditing: false,
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

    function RenderForm(
        touched: FormikTouched<FormikValues>,
        errors: FormikErrors<FormikValues>,
        values: FormikValues,
        setFieldValue: (field: string, value: any) => void,
    ) {
        switch (currentStep) {
            case 0: // Survey Details
                return (
                    <>
                        <div className=''>
                            <div className='py-6'>
                                <h1 className="font-bold text-lg pb-4">Create Survey</h1>
                                <hr/>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-[#25262d] font-medium">Survey Name</label>
                                <Field
                                    name="surveyName"
                                    type="text"
                                    className="w-full px-4 py-2 mt-2 border rounded-md"
                                    placeholder="Enter Title"
                                />
                                {errors.surveyName && touched.surveyName ? (
                                    <span id="surveyName" className="text-sm text-red-500">
									<ErrorMessage id="surveyName" name="surveyName"/>
								</span>
                                ) : null}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-[#25262d] font-medium">Description</label>
                                <Field
                                    name="description"
                                    as="textarea"
                                    className="w-full px-4 py-2 mt-2 border rounded-md"
                                    placeholder="Text Here"
                                />
                                {errors.description && touched.description ? (
                                    <span id="description" className="text-sm text-red-500">
									<ErrorMessage id="description" name="description"/>
								</span>
                                ) : null}
                            </div>

                            <div className="flex space-x-6 w-full">
                                <div className="flex-1 space-y-1.5 mb-3">
                                    <label className="block text-sm text-[#25262d] font-medium">Start Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !values.startDate && "text-muted-foreground"
                                                )}
                                            >
                                                {values.startDate ? (
                                                    format(values.startDate, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="w-4 h-4 ml-auto opacity-50"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <DatePicker name="startDate"/>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.startDate && touched.startDate ? (
                                        <span id="startDate" className="text-sm text-red-500">
                                            <ErrorMessage id="startDate" name="startDate"/>
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex-1 space-y-1.5 mb-3">
                                    <label className="block text-sm text-[#25262d] font-medium">End Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !values.endDate && "text-muted-foreground"
                                                )}
                                            >
                                                {values.endDate ? (
                                                    format(values.endDate, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}

                                                <CalendarIcon className="w-4 h-4 ml-auto opacity-50"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <DatePicker
                                                name="endDate"
                                                minDate={values.startDate ? new Date(values.startDate) : new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.endDate && touched.endDate ? (
                                        <span id="endDate" className="text-sm text-red-500">
                                            <ErrorMessage id="endDate" name="endDate"/>
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-3">
                                <label className="block text-sm text-[#25262d] font-medium">Trigger Word</label>
                                <Field
                                    type="text"
                                    name="triggerWord"
                                    placeholder="Enter Trigger Word ..."
                                    cols={30}
                                    rows={5}
                                    className="w-full border border-input bg-background px-3 py-2 text-sm rounded-[8px] ring-offset-background placeholder-text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.triggerWord && touched.triggerWord ? (
                                    <span id="triggerWord" className="text-sm text-red-500">
									<ErrorMessage id="triggerWord" name="triggerWord"/>
								</span>
                                ) : null}
                            </div>
                        </div>
                    </>
                );

            case 1: // Questions
                return (
                    <>
                        <div className=''>
                            <h1 className="font-bold text-lg pb-4">Create Questions</h1>
                            <hr className="mb-6" />

                            {values.questions.map((question: Question, index: number) => (
                                <div key={index} className="mt-6">
                                    {/* Card container for each question */}
                                    <div className="bg-white shadow-lg p-6 rounded-lg">
                                        <div className="flex space-x-6 w-full">
                                            <div className='flex-1 space-y-1.5'>
                                                <label className="block text-sm font-medium">
                                                    Question {index + 1} {/* Add the question number dynamically */}
                                                </label>
                                                <Field
                                                    name={`questions[${index}].question`}
                                                    type="text"
                                                    className="w-full px-4 py-2 border rounded-md"
                                                    placeholder="Enter your question"
                                                    onFocus={() => {
                                                        if (question.isSaved) {
                                                            setFieldValue(`questions[${index}].isEditing`, true);
                                                        }
                                                    }}
                                                />
                                                {/*{errors.questions?.[index]?.question && touched.questions?.[index]?.question ? (*/}
                                                <span className="text-sm text-red-500">
                                        <ErrorMessage name={`questions[${index}].question`} />
                                    </span>
                                                {/*) : null}*/}
                                            </div>

                                            <div className='space-y-1.5'>
                                                <label className="block text-sm font-medium">Response Type</label>
                                                <Field
                                                    name={`questions[${index}].responseType`}
                                                    as="select"
                                                    className="w-full px-4 py-2 border bg-white rounded-md"
                                                    onFocus={() => {
                                                        if (question.isSaved) {
                                                            setFieldValue(`questions[${index}].isEditing`, true);
                                                        }
                                                    }}
                                                >
                                                    <option value="free-text">Free Text</option>
                                                    <option value="multiple-choice">Multiple Choice</option>
                                                </Field>
                                                {/*{errors.questions?.[index]?.responseType && touched.questions?.[index]?.responseType ? (*/}
                                                <span className="text-sm text-red-500">
                                        <ErrorMessage name={`questions[${index}].responseType`} />
                                    </span>
                                                {/*) : null}*/}
                                            </div>
                                        </div>

                                        {/* Only show options input if responseType is multiple-choice */}
                                        {question.responseType === "multiple-choice" && (
                                            <>
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium">Options</label>
                                                    {question.options.map((option: string, optionIndex: number) => (
                                                        <div key={optionIndex} className="flex justify-between space-x-10 mt-2 items-center">
                                                            <div className="flex-1 items-center">
                                                                <div className='flex justify-between'>
                                                                    <span className="text-sm font-medium">Label {optionIndex + 1}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newOptions = question.options.filter((_, i: number) => i !== optionIndex);
                                                                            setFieldValue(`questions[${index}].options`, newOptions);
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                                                                    >
                                                                        <span className="text-lg">×</span>
                                                                        <span className="text-sm">Remove</span>
                                                                    </button>
                                                                </div>
                                                                <Field
                                                                    name={`questions[${index}].options[${optionIndex}]`}
                                                                    type="text"
                                                                    className="w-full px-4 py-2 border rounded-md"
                                                                    placeholder={`Option ${optionIndex + 1}`}
                                                                />
                                                            </div>

                                                            <div className="flex-1 space-y-2">
                                                                <label className="block text-sm font-medium">After child questions, go to:</label>
                                                                <Field
                                                                    as="select"
                                                                    name={`questions[${index}].branching[${optionIndex}]`}
                                                                    className="w-full px-4 py-2 border rounded-md"
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
                                                    ))}

                                                    <Button
                                                        type="button"
                                                        variant='outline'
                                                        onClick={() => {
                                                            const newOptions = [...question.options, ""];
                                                            setFieldValue(`questions[${index}].options`, newOptions);
                                                        }}
                                                        className="mt-4 px-4 py-2 border-blue-500 text-blue-400 hover:text-blue-500 hover:shadow-md hover:bg-white rounded-md"
                                                    >
                                                        Add Option
                                                    </Button>
                                                </div>

                                                <div className="mt-4 flex items-center space-x-2">
                                                    <Field
                                                        type="checkbox"
                                                        name={`questions[${index}].allowMultiple`}
                                                        id={`allowMultiple-${index}`}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`allowMultiple-${index}`} className="text-sm font-medium">
                                                        Allow participant to pick more than one option
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {/* Conditionally render the Explanation (Optional) input (only for free-text) */}
                                        {question.responseType === "free-text" && (
                                            <div className='flex-1 space-y-1.5 mt-4'>
                                                <label className="block text-sm font-medium">Explanation (Optional)</label>
                                                <Field
                                                    name={`questions[${index}].freeTextDescription`}
                                                    as="textarea"
                                                    className="w-full px-4 py-2 border rounded-md"
                                                    placeholder="Participants will give an open-ended answer..."
                                                    onClick={(e: any) => setDisabled(!isDisabled)}
                                                    disabled={isDisabled}
                                                />
                                            </div>
                                        )}

                                        <div className='py-3 space-y-6'>
                                            <hr />
                                            <div>
                                                <label className="block text-sm font-medium">After answer has been submitted, go to:</label>
                                                <Field
                                                    as="select"
                                                    name={`questions[${index}].branching`}
                                                    className="w-full px-4 py-2 border rounded-md bg-white"
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
                                            <hr />
                                        </div>

                                        <div className="flex items-center justify-between pt-6">
                                            <p className="text-center">{question.question?.length || 0} characters.</p>
                                            <div className="flex items-center space-x-6">
                                                {/* Question Not Saved / Saving Question */}
                                                {(question.isEditing || !question.isSaved) && (
                                                    <div className="flex items-center space-x-2">
                                                        <TriangleAlert className="w-4 h-4 opacity-50 text-red-500" />
                                                        <span className={question.isSaving ? "text-yellow-500" : "text-red-500"}>
                                                {question.isSaving ? "Saving Question..." : "Question Not Saved"}
                                            </span>
                                                    </div>
                                                )}

                                                {/* Save Button (shown when editing or not saved) */}
                                                {(question.isEditing || !question.isSaved) && (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={async () => {
                                                            if (!question.question) {
                                                                // Prevent saving empty questions
                                                                setFieldValue(`questions[${index}].isEditing`, true);
                                                                return;
                                                            }

                                                            // Mark question as saving
                                                            setFieldValue(`questions[${index}].isSaving`, true);

                                                            // Simulate saving (e.g., API call)
                                                            await new Promise((resolve) => setTimeout(resolve, 1000));

                                                            // Mark question as saved and not editing
                                                            setFieldValue(`questions[${index}].isSaving`, false);
                                                            setFieldValue(`questions[${index}].isSaved`, true);
                                                            setFieldValue(`questions[${index}].isEditing`, false);
                                                        }}
                                                    >
                                                        Save Question
                                                    </Button>
                                                )}

                                                {/* Delete Icon (shown when question is saved and not editing) */}
                                                {question.isSaved && !question.isEditing && (
                                                    <button
                                                        type="button"
                                                        className="rounded-full border border-gray-400 p-[0.6rem] shadow-sm hover:border-red-500 focus-visible:outline-red-700"
                                                        onClick={() => {
                                                            setDeleteConfirmation({
                                                                isOpen: true,
                                                                questionIndex: index,
                                                            });
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 opacity-50" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Show "Add New Question" button only if all questions are saved */}
                            {values.questions.every((q: Question) => q.isSaved) && (
                                <div className='flex justify-end items-center py-4'>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const newQuestion = {
                                                question: '',
                                                responseType: "free-text",
                                                options: [],
                                                allowMultiple: false,
                                                freeTextDescription: '',
                                                isSaved: false,
                                                isSaving: false,
                                                isEditing: false,
                                                branching: null
                                            };
                                            setFieldValue("questions", [...values.questions, newQuestion]);
                                        }}
                                    >
                                        Add New Question
                                    </Button>
                                </div>
                            )}

                            <hr />
                        </div>

                        {/* Delete Confirmation Dialog */}
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
                        <div>
                            <h1 className="text-lg font-bold mb-2">Compose a survey completion message (optional)</h1>
                            <p className="text-sm text-gray-600 mb-4">
                                This message will be sent to participants after they answer their last question.
                            </p>

                            {/* Completion Message Textarea */}
                            <Field
                                as="textarea"
                                name="completionMessage"
                                placeholder="E.g. Thank you for taking the time to complete our survey! Your feedback is invaluable to us and helps us improve."
                                className="w-full p-3 border rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                rows={4}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    // Reset save state when the user edits the message
                                    if (values.isCompletionMessageSaved) {
                                        setFieldValue("isCompletionMessageSaved", false);
                                    }
                                    // Update the completion message
                                    setFieldValue("completionMessage", e.target.value);
                                }}
                            />
                            <ErrorMessage name="completionMessage" component="div" className="text-xs pt-2 text-red-500" />

                            {/* Character Count and Save Button */}
                            <div className="flex justify-between text-center items-center text-xs text-gray-500 mt-2">
                                <p>{values.completionMessage?.length || 0} characters</p>
                                <Button
                                    type="button"
                                    variant={(values.isCompletionMessageSaved ? "secondary" : "default") as | "default" | "secondary"} // Blue when not saved, gray when saved
                                    onClick={async () => {
                                        if (!values.completionMessage) {
                                            // Prevent saving if the input is empty
                                            return;
                                        }

                                        // Mark completion message as saving
                                        setFieldValue("isSavingCompletionMessage", true);

                                        // Simulate saving (e.g., API call)
                                        await new Promise((resolve) => setTimeout(resolve, 1000));

                                        // Mark completion message as saved
                                        setFieldValue("isSavingCompletionMessage", false);
                                        setFieldValue("isCompletionMessageSaved", true);
                                    }}
                                    disabled={values.isCompletionMessageSaved || !values.completionMessage} // Disable if saved or empty
                                >
                                    {values.isSavingCompletionMessage ? "Saving..." : "Save Message"}
                                </Button>
                            </div>
                        </div>
                    </>
                );

            case 3: // Send Survey
                switch (sendSurveyStep) {

                    case 0: // Add Recipients
                        return (
                            <div>
                                <h1 className="font-bold text-lg pb-4">Add Survey Participants</h1>
                                <hr className="mb-6"/>

                                <div className="flex space-x-4 mb-6">
                                    <Button
                                        type="button"
                                        className="bg-blue-500 hover:bg-blue-700 focus:outline-none"
                                    >
                                        Select from contacts list
                                    </Button>
                                    <p className='flex justify-center items-center'>or</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-transparent border border-[#E3E5EB] shadow-sm hover:shadow-md hover:bg-transparent focus:outline-none"
                                    >
                                        Upload file
                                    </Button>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-lg text-[#25262d] font-medium">
                                        Select Survey Participants from your contacts list
                                    </label>
                                    <div className="flex flex-col">
                                        <label className="inline-flex items-center">
                                            <Field
                                                type="radio"
                                                name="recipientSelectionType"
                                                value="all"
                                                className="form-radio"
                                                onChange={() => {
                                                    // When "All contacts" is selected, set recipients to all contacts
                                                    setFieldValue('recipientSelectionType', 'all');
                                                    setFieldValue('recipients', contacts);
                                                    setFieldValue('selectedContactIds', contacts.map(c => Number(c.id)));
                                                }}
                                            />
                                            <span className="ml-2">All contacts ( {contacts.length || 0} )</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <Field
                                                type="radio"
                                                name="recipientSelectionType"
                                                value="select"
                                                className="form-radio"
                                                onChange={() => {
                                                    // When "Select" is chosen, clear recipients
                                                    setFieldValue('recipientSelectionType', 'select');
                                                    setFieldValue('recipients', []);
                                                    setFieldValue('selectedContactIds', []);
                                                }}
                                            />
                                            <span className="ml-2">Select Survey Participants</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Show contact selection table when "select" is chosen */}
                                {values.recipientSelectionType === 'select' && (
                                    <div className="mt-4">
                                        <h3 className="text-md font-medium mb-2">Select Contacts</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    // Select all contacts
                                                                    setFieldValue('recipients', contacts);
                                                                    setFieldValue('selectedContactIds', contacts.map(c => Number(c.id)));
                                                                } else {
                                                                    // Deselect all
                                                                    setFieldValue('recipients', []);
                                                                    setFieldValue('selectedContactIds', []);
                                                                }
                                                            }}
                                                            checked={values.recipients.length === contacts.length && contacts.length > 0}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-2 text-left">Name</th>
                                                    <th className="px-4 py-2 text-left">Phone</th>
                                                    <th className="px-4 py-2 text-left">Email</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {contacts.map((contact) => (
                                                    <tr key={contact.id} className="border-t">
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={values.recipients.some(r => r.id === contact.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        // Add contact to recipients
                                                                        setFieldValue('recipients', [...values.recipients, contact]);
                                                                        setFieldValue('selectedContactIds', [
                                                                            ...values.selectedContactIds,
                                                                            Number(contact.id)
                                                                        ]);
                                                                    } else {
                                                                        // Remove contact from recipients
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
                                                        <td className="px-4 py-2">{contact.names}</td>
                                                        <td className="px-4 py-2">{contact.phone}</td>
                                                        <td className="px-4 py-2">{contact.email}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Selected: {values.recipients.length} contacts
                                        </p>
                                    </div>
                                )}
                            </div>
                        );

                    case 1: // Review Recipients
                        return (
                            <div className=''>
                                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0'>
                                    <div className='space-y-3'>
                                        <h1 className="font-bold text-lg pb-4">Review Recipients</h1>
                                        <p className='text-gray-500 text-sm font-normal'>
                                            Kindly review the recipients and rectify the ones that need fixing.
                                        </p>
                                    </div>

                                    <div className='flex space-x-4'>
                                        <AddContactsModal
                                            isOpen={isModalOpen}
                                            onClose={() => setIsModalOpen(false)}
                                            onAddRecipient={(newRecipient) => {
                                                const newContact: Contact = {
                                                    id: String(Date.now()),
                                                    names: newRecipient.names,
                                                    phone: newRecipient.phone,
                                                    email: newRecipient.email || '',
                                                    // gender: newRecipient.gender,
                                                    // contact_group_id: newRecipient.contact_group_id
                                                };

                                                // Update the Formik recipients field
                                                setFieldValue('recipients', [...values.recipients, newContact]);

                                                // Close the modal
                                                setIsModalOpen(false);

                                                toast.success('Recipient added successfully!');
                                            }}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsModalOpen(true)}
                                            className="flex justify-center items-center text-blue-500 space-x-2 bg-transparent border border-blue-500 shadow-sm hover:shadow-md hover:bg-transparent hover:text-blue-500 focus:outline-none"
                                        >
                                            <UserPlus className='w-4 h-4' />
                                            <span>Add New Recipient</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex justify-center items-center text-gray-400 hover:text-gray-400 space-x-2 bg-transparent border border-[#E3E5EB] shadow-sm hover:shadow-md hover:bg-transparent focus:outline-none"
                                        >
                                            <Trash2 className='w-4 h-4' />
                                            <span>Delete</span>
                                        </Button>

                                        <Field
                                            name='search'
                                            type="text"
                                            className="px-4 py-2 border rounded-md"
                                            placeholder="Search for recipient"
                                        />
                                    </div>
                                </div>

                                {/* Display recipients in a table */}
                                <table className="w-full border border-[#E3E5EB] rounded-lg shadow-md">
                                    <thead>
                                    <tr className="bg-white text-gray-500 text-left uppercase text-sm">
                                        <th className="px-4 py-3">
                                            <input type="checkbox" className="w-4 h-4" />
                                        </th>
                                        <th className="px-4 py-3">Number</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {values.recipients.map((contact: Contact) => (
                                        <tr key={contact.id} className="border-t border-[#E3E5EB] bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="w-4 h-4" />
                                            </td>
                                            <td className="px-4 py-3 text-blue-500">{contact.phone}</td>
                                            <td className="px-4 py-3">{contact.names}</td>
                                            <td className="px-4 py-3 flex space-x-2">
                                                <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                                                    <EditIcon className='w-4 h-4' />
                                                </button>
                                                <button
                                                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-200"
                                                    onClick={() => {
                                                        // Remove recipient from the list
                                                        setFieldValue(
                                                            'recipients',
                                                            values.recipients.filter((r: Contact) => r.id !== contact.id)
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className='w-4 h-4' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                {values.recipients.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No recipients selected. Please go back and select recipients.
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-200">
                                            ←
                                        </button>
                                        <span>Page 1 of 1</span>
                                        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-200">
                                            →
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select className="border border-gray-300 p-2 rounded-md">
                                            <option>10</option>
                                            <option>20</option>
                                            <option>50</option>
                                        </select>
                                        <span>Rows per page</span>
                                    </div>
                                </div>
                            </div>
                        );

                    case 2: // Invitation
                        return (
                            <div className='space-y-6'>
                                <h1 className="font-bold text-lg pb-4">Compose Invitation</h1>
                                <p className='text-gray-500 text-sm'>
                                    Compose an invitation message for opting into your survey and schedule the time you want it to be sent in this step.
                                </p>
                                <hr className="mb-6"/>

                                {/* Invitation Message Textarea */}
                                <div className="mb-6">
                                    <label className="block text-sm text-[#25262d] font-medium">Invitation
                                        Message</label>
                                    <Field
                                        as="textarea"
                                        name="invitationMessage"
                                        className="w-full px-4 py-2 mt-2 border rounded-md"
                                        rows={4}
                                        placeholder="Reply with START to participate"
                                    />
                                </div>

                                <div className='text-xs text-gray-500 space-y-6'>
                                    <p>
                                        This message contains the following additional characters for Safaricom recipients: STOP*456*9*5#
                                    </p>
                                    <p>
                                        {values.invitationMessage.length || 0} characters  1 message(s) . GSM 7 Encoding
                                    </p>
                                </div>

                                {/* Schedule Time Picker */}
                                <div className="mb-6">
                                    <label className="block text-sm text-[#25262d] font-medium">Schedule Time</label>
                                    <Field
                                        type="datetime-local"
                                        name="scheduleTime"
                                        className="w-full px-4 py-2 mt-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        );

                    case 3: // Send
                        return (
                            <div>
                                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0'>
                                    <div className='space-y-3'>
                                        <h1 className="font-bold text-lg pb-4">Review and Send</h1>
                                        <p className='text-gray-500 text-sm font-normal'>Kindly review the invitation message.</p>
                                    </div>

                                    <div className='flex space-x-4'>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex justify-center items-center text-blue-500 space-x-2 bg-transparent border border-blue-500 shadow-sm hover:shadow-md hover:bg-transparent hover:text-blue-500 focus:outline-none"
                                        >
                                            <Download className='w-4 h-4' />
                                            <span>Download CSV</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex justify-center items-center text-gray-400 hover:text-gray-400 space-x-2 bg-transparent border border-[#E3E5EB] shadow-sm hover:shadow-md hover:bg-transparent focus:outline-none"
                                        >
                                            <Trash2 className='w-4 h-4' />
                                            <span>Delete</span>
                                        </Button>
                                        <Field
                                            name='search'
                                            type="text"
                                            className="px-4 py-2 border rounded-md"
                                            placeholder="Search for Messages"
                                        />
                                    </div>
                                </div>

                                {/* Display invitation details */}
                                <div className="mb-6">
                                    <table className="w-full border border-[#E3E5EB] rounded-lg shadow-md">
                                        <thead>
                                        <tr className="bg-white text-gray-500 text-left uppercase text-sm">
                                            <th className="px-4 py-3">
                                                <input type="checkbox" className="w-4 h-4" />
                                            </th>
                                            <th className="px-4 py-3">Message</th>
                                            <th className="px-4 py-3">Number</th>
                                            <th className="px-4 py-3">msg count</th>
                                            <th className="px-4 py-3">name</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr className="border-t border-[#E3E5EB] bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="w-4 h-4" />
                                            </td>
                                            <td className="px-4 py-3 text-blue-500">+Reply with START to participate STOP*000*2*1#</td>
                                            <td className="px-4 py-3 text-blue-500">+254748815593</td>
                                            <td className="px-4 py-3 text-blue-500">1</td>
                                            <td className="px-4 py-3">Alex Otieno</td>
                                            <td className="px-4 py-3 flex space-x-2">
                                                <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                                                    <EditIcon className='w-4 h-4' />
                                                </button>
                                                <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                                                    <Trash2 className='w-4 h-4' />
                                                </button>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-200">
                                                ←
                                            </button>
                                            <span>Page 1 of 1</span>
                                            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-200">
                                                →
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <select className="border border-gray-300 p-2 rounded-md">
                                                <option>10</option>
                                                <option>20</option>
                                                <option>50</option>
                                            </select>
                                            <span>Rows per page</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex justify-center items-center text-red-400 hover:text-red-400 space-x-2 bg-transparent border border-red-400 shadow-sm hover:shadow-md hover:bg-transparent focus:outline-none"
                                            >
                                                <Trash2 className='w-4 h-4' />
                                                <span>Discard</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );

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
        console.log(values)
        try {
            // Transform the data to match the backend expectations
            const surveyData = {
                surveyName: values.surveyName,
                description: values.description,
                startDate: values.startDate,
                endDate: values.endDate,
                triggerWord: values.triggerWord,
                completionMessage: values.completionMessage,
                invitationMessage: values.invitationMessage,
                scheduleTime: values.scheduleTime,
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
            console.log(values)

            // Submit using Inertia
            router.post('/surveys/question', surveyData, {
                onSuccess: () => {
                    toast.success('Survey created successfully!', {
                        position: 'top-center',
                        richColors: true,
                    });
                    console.log(values)
                    router.visit('/surveys/question');
                },
                onError: (errors) => {
                    console.log(values);
                    console.error('Validation errors:', errors);
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
        values: FormikValues,
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
                        !values.triggerWord)
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
                    !errors.triggerWord
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
                            isSaved: boolean;
                        }) =>
                            !question.question ||
                            !question.responseType ||
                            !question.isSaved,
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
                    if (!values.scheduleTime) {
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

    const isStep0Complete = (values: FormikValues) => {
        return (
            values.surveyName &&
            values.description &&
            values.startDate &&
            values.endDate &&
            values.triggerWord
        );
    };

    const isStep1Complete = (values: FormikValues) => {
        return values.questions.every(
            (question: Question) =>
                question.question &&
                question.responseType &&
                (question.responseType === "free-text" || question.options.length > 0)
        );
    };

    const isStep2Complete = (values: FormikValues) => {
        return values.completionMessage;
    };

    const isStep3Complete = (values: FormValues) => {
        return values.recipients.length > 0;
    };

    const isStep4Complete = (values: FormValues) => {
        return values.invitationMessage && values.scheduleTime;
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
                                    onClick={() => setCurrentStep(0)}
                                >
                                    Survey Details
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 1
                                            ? 'bg-blue-500 text-white'
                                            : isStep0Complete(values)
                                              ? 'cursor-pointer bg-white text-gray-500'
                                              : 'cursor-not-allowed text-gray-400'
                                    }`}
                                    onClick={() => {
                                        if (isStep0Complete(values)) {
                                            setCurrentStep(1);
                                        }
                                    }}
                                >
                                    Questions ({values.questions.length})
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 2
                                            ? 'bg-blue-500 text-white'
                                            : isStep1Complete(values)
                                              ? 'cursor-pointer bg-white text-gray-500'
                                              : 'cursor-not-allowed text-gray-400'
                                    }`}
                                    onClick={() => {
                                        if (isStep1Complete(values)) {
                                            setCurrentStep(2);
                                        }
                                    }}
                                >
                                    Survey Outro
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center border px-3 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${
                                        currentStep === 3
                                            ? 'bg-blue-500 text-white'
                                            : isStep2Complete(values)
                                              ? 'cursor-pointer bg-white text-gray-500'
                                              : 'cursor-not-allowed text-gray-400'
                                    }`}
                                    onClick={() => {
                                        if (isStep2Complete(values)) {
                                            setCurrentStep(3);
                                        }
                                    }}
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
                                {RenderForm(
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
                                                        submitForm, // Pass submitForm
                                                    )
                                                }
                                                disabled={isSubmitting} // Optional: disable while submitting
                                            >
                                                {currentStep === 3 && sendSurveyStep === 3
                                                    ? (isSubmitting ? "Sending..." : "Send Survey")
                                                    : (
                                                        <>
                                                            <span>Next</span>
                                                            <MoveRight/>
                                                        </>
                                                    )}
                                            </Button>
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
