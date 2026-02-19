import { Transition } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import type {
    FormikErrors,
    FormikTouched,
    FormikValues} from 'formik';
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
import { useEffect, useState } from 'react';
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
}

interface Recipient {
    id: string;
    name: string;
    phone: string;
    email: string;
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
    recipients: Recipient[];
    invitationMessage: string;
    scheduleTime: string;
}

const initialValues: FormValues = {
    surveyName: '',
    description: '',
    startDate: '',
    endDate: '',
    triggerWord: '',
    questions: [{
        question: '',
        responseType: "free-text",
        options: [],
        allowMultiple: false,
        freeTextDescription: '',
    }],
    completionMessage: '',
    recipients: [],
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
    const [contacts, setContacts] = useState<Recipient[]>([]);
    const [isDisabled, setDisabled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        questionIndex: number | null;
    }>({
        isOpen: false,
        questionIndex: null,
    });

    // const handleFormStep = (step: number) => {
    //     if (step < 4) {
    //         setCurrentStep(step);
    //     }
    // }

    // fetch contact from the JSON file
    useEffect(() => {
        fetch('/contacts.json')
            .then((response) => response.json())
            .then((data) =>{
                setContacts(data.contacts); // Set the contacts state
                console.log(data.contacts); // Set the contacts state
            })
            .catch((error) => {
                console.error('Error fetching contacts:', error);
            })
    }, [])

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
                                <div className="flex-1 space-y-[6px] mb-3">
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

                                <div className="flex-1 space-y-[6px] mb-3">
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

                            <div className="space-y-[6px] mb-3">
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
                                            <div className='flex-1 space-y-[6px]'>
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

                                            <div className='space-y-[6px]'>
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
                                            <div className='flex-1 space-y-[6px] mt-4'>
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
                                        className=" bg-transparent border border-[#E3E5EB] shadow-sm hover:shadow-md hover:bg-transparent focus:outline-none"
                                    >
                                        Upload file
                                    </Button>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-lg  text-[#25262d] font-medium">Select Survey
                                        Participants from your contacts list</label>
                                    <div className="flex flex-col">
                                        <label className="inline-flex items-center">
                                            <Field
                                                type="radio"
                                                name="recipients"
                                                value="all"
                                                className="form-radio"
                                            />
                                            <span className="ml-2">All contacts ( {contacts.length || 0} ) </span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <Field
                                                type="radio"
                                                name="recipients"
                                                value="select"
                                                className="form-radio"
                                            />
                                            <span className="ml-2">Select Survey Participants</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );

                    case 1: // Review Recipients
                        return (
                            <div className=''>
                                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0'>
                                    <div className='space-y-3'>
                                        <h1 className="font-bold text-lg pb-4">Review Recipients</h1>
                                        <p className='text-gray-500 text-sm font-normal'>Kindly review the recipients and rectify the ones that need fixing.</p>
                                    </div>

                                    <div className='flex space-x-4'>

                                        {/* Render the AddContactsModal */}
                                        <AddContactsModal
                                            isOpen={isModalOpen}
                                            onClose={() => setIsModalOpen(false)}
                                            onAddRecipient={(newRecipient) => {
                                                const recipientWithId = {
                                                    ...newRecipient,
                                                    id: String(contacts.length + 1), // Generate a unique ID
                                                };

                                                // Update the contacts state
                                                setContacts([...contacts, recipientWithId]);

                                                // Update the Formik recipients field
                                                setFieldValue('recipients', [...values.recipients, recipientWithId]);

                                                // Close the modal
                                                setIsModalOpen(false);
                                            }}
                                        />

                                        {/* Button to open the modal */}
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
                                            <Trashany2 className='w-4 h-4' />
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
                                    {contacts.map((contact: Recipient) => (
                                        <tr key={contact.id} className="border-t border-[#E3E5EB] bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="w-4 h-4" />
                                            </td>
                                            <td className="px-4 py-3 text-blue-500">{contact.phone}</td>
                                            <td className="px-4 py-3">{contact.name}</td>
                                            <td className="px-4 py-3 flex space-x-2">
                                                <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                                                    <EditIcon className='w-4 h-4' />
                                                </button>
                                                <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-200">
                                                    <Trash2 className='w-4 h-4' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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

    const handleSubmit = (values: FormikValues) => {
        console.log(values);
    };

    function handleNextStep(
        values: FormikValues,
        validateField: (field: string) => (Promise<void> | Promise<string | undefined>),
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        setTouched: (touched: import("formik").FormikTouched<FormValues>, shouldValidate?: (boolean | undefined)) => Promise<void | import("formik").FormikErrors<FormValues>>,
        errors: FormikErrors<FormikValues>
    ) {
        switch (currentStep) {
            case 0:
                if (
                    currentStep === 0 &&
                    (!values.surveyName || !values.description || !values.startDate || !values.endDate || !values.triggerWord)
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
                        true
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
                    values.questions.some(question => !question.question || !question.responseType || !question.isSaved)
                ) {
                    values.questions.forEach((_, index) => {
                        validateField(`questions[${index}].question`);
                        validateField(`questions[${index}].responseType`);
                    });
                    setTouched({
                        questions: values.questions.map(() => ({
                            question: true,
                            responseType: true,
                        }))
                    });
                } else if (
                    currentStep === 1 &&
                    !errors.questions
                ) {
                    setCurrentStep(currentStep + 1);
                }
                break;

            case 2:
                if (values.completionMessage && !values.isCompletionMessageSaved) {
                    // Prevent moving to the next step if the completion message is not saved
                    toast.error("Please save the completion message before proceeding.", { position: "top-center", richColors: true });
                    return;
                }
                setCurrentStep(currentStep + 1);
                break;

            case 3:
                if (sendSurveyStep < 3) {
                    setSendSurveyStep(sendSurveyStep + 1);
                } else {
                    handleSubmit(values);
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
            (question) =>
                question.question &&
                question.responseType &&
                (question.responseType === "free-text" || question.options.length > 0)
        );
    };

    const isStep2Complete = (values: FormikValues) => {
        return values.completionMessage;
    };

    // const isStep3Complete = (values: FormValues) => {
    //     return values.recipients.length > 0;
    // };
    //
    // const isStep4Complete = (values: FormValues) => {
    //     return values.invitationMessage && values.scheduleTime;
    // };


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
                      }) => (
                        <>
                            <div className="inline-flex h-9 items-center rounded-lg bg-muted  text-muted-foreground">
                                <div
                                    className={`
                                inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow border                          ${
                                        currentStep === 0
                                            ? "bg-blue-500 text-white"
                                            : "bg-white text-gray-500"
                                    }`}
                                    onClick={() => setCurrentStep(0)}
                                >
                                    Survey Details
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow border
                                    ${
                                        currentStep === 1
                                            ? "bg-blue-500 text-white"
                                            : isStep0Complete(values)
                                                ? "bg-white text-gray-500 cursor-pointer"
                                                : "text-gray-400 cursor-not-allowed"
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
                                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow border
                                    ${
                                        currentStep === 2
                                            ? "bg-blue-500 text-white"
                                            : isStep1Complete(values)
                                                ? "bg-white text-gray-500 cursor-pointer"
                                                : "text-gray-400 cursor-not-allowed"
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
                                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow border
                                    ${
                                        currentStep === 3
                                            ? "bg-blue-500 text-white"
                                            : isStep2Complete(values)
                                                ? "bg-white text-gray-500 cursor-pointer"
                                                : "text-gray-400 cursor-not-allowed"
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
                                    onStepClick={(step) => setSendSurveyStep(step)}
                                />
                            )}

                            <Form className='bg-white'>
                                {RenderForm(touched, errors, values, setFieldValue)}
                                <div className='py-6'>
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
                                                    className='space-x-2'
                                                    variant='outline'
                                                    onClick={() => {
                                                        if (currentStep === 3 && sendSurveyStep > 0) {
                                                            setSendSurveyStep(sendSurveyStep - 1);
                                                        } else {
                                                            setCurrentStep(currentStep - 1);
                                                        }
                                                    }}
                                                >
                                                    <MoveLeft/>
                                                    <span>Back</span>
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="default"
                                                className="px-6 py-3 text-base font-semibold border border-transparent rounded-lg shadow-sm focus:outline-none w-auto space-x-2"
                                                onClick={() => handleNextStep(values, validateField, setTouched, errors)}
                                            >
                                                {currentStep === 3 && sendSurveyStep === 3 ? "Send Survey" : (
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
    )
}
