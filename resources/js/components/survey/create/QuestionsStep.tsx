import { Field } from 'formik';
import React from 'react';
import ChildQuestionsModal from '@/components/ChildQuestionsModal';
import type { ChildQuestionOptionState } from '@/components/ChildQuestionsModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import {
    buildSimulatorChildQuestionText,
    buildSimulatorQuestionText,
    isBranchingEndTarget,
    parseMultipleChoiceReply,
    resolveNextChildQuestionIndex,
    resolveNextParentQuestionIndexFromTarget,
    resolveNextSimulatorQuestionIndex,
} from '@/components/survey/create/simulator-utils';
import type { FormValues, Question, SetFieldValue, SimulatorMessage, SimulatorSession } from '@/components/survey/create/types';
import SurveyBranchingSelect from '@/components/survey/SurveyBranchingSelect';
import SurveyQuestionCard from '@/components/survey/SurveyQuestionCard';
import SurveyQuestionFooterActions from '@/components/survey/SurveyQuestionFooterActions';
import SurveyQuestionMainFields from '@/components/survey/SurveyQuestionMainFields';
import SurveyQuestionOptionRow from '@/components/survey/SurveyQuestionOptionRow';
import SurveySimulatorPanel from '@/components/survey/SurveySimulatorPanel';
import SurveyStepIntroCard from '@/components/survey/SurveyStepIntroCard';
import { Button } from '@/components/ui/button';

interface QuestionsStepProps {
    values: FormValues;
    setFieldValue: SetFieldValue;
    childQuestionStates: Record<string, ChildQuestionOptionState>;
    setChildQuestionStates: React.Dispatch<React.SetStateAction<Record<string, ChildQuestionOptionState>>>;
}

export default function QuestionsStep({
    values,
    setFieldValue,
    childQuestionStates,
    setChildQuestionStates,
}: QuestionsStepProps) {
    const [activeChildQuestionModal, setActiveChildQuestionModal] = React.useState<{
        questionIndex: number;
        optionIndex: number;
    } | null>(null);

    const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
        isOpen: boolean;
        questionIndex: number | null;
    }>({ isOpen: false, questionIndex: null });

    const simulatorMessageCounter = React.useRef(2);
    const [simulatorInput, setSimulatorInput] = React.useState('');
    const [simulatorSession, setSimulatorSession] = React.useState<SimulatorSession>({
        started: false,
        activeNode: null,
        messages: [
            {
                id: 1,
                sender: 'muted',
                text: 'Reply with START to participate.',
            },
        ],
    });

    const previewQuestion = values.questions.find(
        (question) => question.question.trim().length > 0,
    ) ?? values.questions[0];
    const previewTriggerWord = values.triggerWord.trim() || 'START';
    const previewShortCode = values.shortCode.trim() || '20642';
    const canAddNewQuestion = values.questions.every((question) => {
        const hasSavedOptions = question.responseType === 'multiple-choice'
            ? question.options.length > 0 &&
                question.options.every((option) => option.trim().length > 0) &&
                question.options.every((_, optionIndex) => Boolean(question.optionSaveStates?.[optionIndex]))
            : true;

        return Boolean(
            question.isSaved &&
            !question.isEditing &&
            question.question.trim().length > 0 &&
            hasSavedOptions,
        );
    });

    const childQuestionStateKey = (questionIndex: number, optionIndex: number): string => {
        return `${questionIndex}-${optionIndex}`;
    };

    const createDefaultChildQuestionState = (
        questionIndex: number,
        optionIndex: number,
    ): ChildQuestionOptionState => {
        const currentQuestion = values.questions[questionIndex];
        const optionBranching = Array.isArray(currentQuestion?.branching)
            ? currentQuestion.branching[optionIndex]
            : null;

        return {
            childQuestions: [
                {
                    id: 1,
                    question: '',
                    responseType: 'free-text',
                    branching: '0',
                    options: [],
                    optionSaveStates: [],
                    optionBranching: [],
                    allowMultiple: false,
                    isSaved: false,
                },
            ],
            followUpBranching: optionBranching !== null && optionBranching !== undefined
                ? String(optionBranching)
                : '0',
        };
    };

    const simulatorPromptText = `Reply with ${previewTriggerWord} to participate.`;

    const nextSimulatorMessageId = (): number => {
        const messageId = simulatorMessageCounter.current;
        simulatorMessageCounter.current += 1;

        return messageId;
    };

    const resetSimulator = (): void => {
        simulatorMessageCounter.current = 2;
        setSimulatorInput('');
        setSimulatorSession({
            started: false,
            activeNode: null,
            messages: [
                {
                    id: 1,
                    sender: 'muted',
                    text: simulatorPromptText,
                },
            ],
        });
    };

    const handleSimulatorSend = (): void => {
        const participantReply = simulatorInput.trim();

        if (participantReply.length === 0) {
            return;
        }

        setSimulatorSession((previousSession) => {
            const updatedMessages: SimulatorMessage[] = [
                ...previousSession.messages,
                {
                    id: nextSimulatorMessageId(),
                    sender: 'user',
                    text: participantReply,
                },
            ];

            if (!previousSession.started) {
                if (participantReply.toLowerCase() !== previewTriggerWord.toLowerCase()) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'muted',
                        text: simulatorPromptText,
                    });

                    return {
                        ...previousSession,
                        messages: updatedMessages,
                    };
                }

                const firstQuestion = values.questions[0];
                if (!firstQuestion || firstQuestion.question.trim().length === 0) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'system',
                        text: 'No question is configured yet. Add a question on the left to test the flow.',
                    });

                    return {
                        started: false,
                        activeNode: null,
                        messages: updatedMessages,
                    };
                }

                updatedMessages.push({
                    id: nextSimulatorMessageId(),
                    sender: 'system',
                    text: buildSimulatorQuestionText(firstQuestion),
                });

                return {
                    started: true,
                    activeNode: {
                        kind: 'parent',
                        questionIndex: 0,
                    },
                    messages: updatedMessages,
                };
            }

            if (!previousSession.activeNode) {
                updatedMessages.push({
                    id: nextSimulatorMessageId(),
                    sender: 'system',
                    text: 'No active question in the simulator. Press reset and try again.',
                });

                return {
                    started: false,
                    activeNode: null,
                    messages: updatedMessages,
                };
            }

            const finalizeSurvey = (reason?: string): SimulatorSession => {
                if (reason) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'muted',
                        text: reason,
                    });
                }

                const completionMessage = values.completionMessage?.trim() || '';
                if (completionMessage.length > 0) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'system',
                        text: completionMessage,
                    });
                } else {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'muted',
                        text: 'Add a completion message in Survey Outro to customize the final SMS.',
                    });
                }
                updatedMessages.push({
                    id: nextSimulatorMessageId(),
                    sender: 'muted',
                    text: '-- End of survey --',
                });

                return {
                    started: false,
                    activeNode: null,
                    messages: updatedMessages,
                };
            };

            const moveToParentQuestion = (
                nextQuestionIndex: number,
                endReason?: string,
            ): SimulatorSession => {
                if (nextQuestionIndex === -1) {
                    return finalizeSurvey(endReason);
                }

                const nextQuestion = values.questions[nextQuestionIndex];
                if (!nextQuestion || nextQuestion.question.trim().length === 0) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'system',
                        text: 'Next question is empty. Update it on the left panel to continue simulation.',
                    });

                    return {
                        started: false,
                        activeNode: null,
                        messages: updatedMessages,
                    };
                }

                updatedMessages.push({
                    id: nextSimulatorMessageId(),
                    sender: 'system',
                    text: buildSimulatorQuestionText(nextQuestion),
                });

                return {
                    started: true,
                    activeNode: {
                        kind: 'parent',
                        questionIndex: nextQuestionIndex,
                    },
                    messages: updatedMessages,
                };
            };

            if (previousSession.activeNode.kind === 'parent') {
                const activeQuestionIndex = previousSession.activeNode.questionIndex;
                const activeQuestion = values.questions[activeQuestionIndex];

                if (!activeQuestion) {
                    return {
                        started: false,
                        activeNode: null,
                        messages: updatedMessages,
                    };
                }

                let optionIndex: number | null = null;
                let parentEndReason: string | undefined;

                if (activeQuestion.responseType === 'multiple-choice') {
                    const availableOptions = activeQuestion.options
                        .map((option) => option.trim())
                        .filter((option) => option.length > 0);

                    optionIndex = parseMultipleChoiceReply(participantReply, availableOptions);
                    if (optionIndex === null) {
                        updatedMessages.push({
                            id: nextSimulatorMessageId(),
                            sender: 'system',
                            text: `Please reply with option number (1-${availableOptions.length}) or exact option text.`,
                        });

                        return {
                            ...previousSession,
                            messages: updatedMessages,
                        };
                    }

                    const optionState = childQuestionStates[`${activeQuestionIndex}-${optionIndex}`];
                    const savedChildQuestions = optionState
                        ? optionState.childQuestions.filter(
                            (childQuestion) => childQuestion.isSaved && childQuestion.question.trim().length > 0,
                        )
                        : [];

                    if (savedChildQuestions.length > 0) {
                        updatedMessages.push({
                            id: nextSimulatorMessageId(),
                            sender: 'system',
                            text: buildSimulatorChildQuestionText(savedChildQuestions[0]),
                        });

                        return {
                            started: true,
                            activeNode: {
                                kind: 'child',
                                parentQuestionIndex: activeQuestionIndex,
                                optionIndex,
                                childQuestionIndex: 0,
                                followUpBranching: optionState?.followUpBranching ?? null,
                            },
                            messages: updatedMessages,
                        };
                    }

                    if (!activeQuestion.allowMultiple) {
                        const selectedOptionTarget = Array.isArray(activeQuestion.branching)
                            ? activeQuestion.branching[optionIndex] ?? null
                            : null;

                        if (isBranchingEndTarget(selectedOptionTarget)) {
                            parentEndReason = `Flow ended at Question ${activeQuestionIndex + 1} by "After child questions, go to: End Survey" for option ${optionIndex + 1}.`;
                        }
                    }
                }

                if (
                    activeQuestion.responseType !== 'multiple-choice' ||
                    activeQuestion.allowMultiple
                ) {
                    if (isBranchingEndTarget(activeQuestion.branching)) {
                        parentEndReason = `Flow ended at Question ${activeQuestionIndex + 1} by "After answer has been submitted, go to: End Survey".`;
                    }
                }

                const nextQuestionIndex = resolveNextSimulatorQuestionIndex(
                    activeQuestion,
                    activeQuestionIndex,
                    values.questions.length,
                    optionIndex,
                );

                return moveToParentQuestion(nextQuestionIndex, parentEndReason);
            }

            const {
                parentQuestionIndex,
                optionIndex,
                childQuestionIndex,
                followUpBranching,
            } = previousSession.activeNode;
            const optionState = childQuestionStates[`${parentQuestionIndex}-${optionIndex}`];
            const savedChildQuestions = optionState
                ? optionState.childQuestions.filter(
                    (childQuestion) => childQuestion.isSaved && childQuestion.question.trim().length > 0,
                )
                : [];

            const activeChildQuestion = savedChildQuestions[childQuestionIndex];
            if (!activeChildQuestion) {
                const nextParentQuestionIndex = resolveNextParentQuestionIndexFromTarget(
                    followUpBranching,
                    parentQuestionIndex,
                    values.questions.length,
                );

                return moveToParentQuestion(
                    nextParentQuestionIndex,
                    'Flow ended by "After child questions, go to: End Survey".',
                );
            }

            let childOptionIndex: number | null = null;
            if (activeChildQuestion.responseType === 'multiple-choice') {
                const childOptions = (activeChildQuestion.options ?? [])
                    .map((option) => option.trim())
                    .filter((option) => option.length > 0);

                childOptionIndex = parseMultipleChoiceReply(participantReply, childOptions);
                if (childOptionIndex === null) {
                    updatedMessages.push({
                        id: nextSimulatorMessageId(),
                        sender: 'system',
                        text: `Please reply with option number (1-${childOptions.length}) or exact option text.`,
                    });

                    return {
                        ...previousSession,
                        messages: updatedMessages,
                    };
                }
            }

            const nextChildQuestionIndex = resolveNextChildQuestionIndex(
                activeChildQuestion,
                childQuestionIndex,
                savedChildQuestions.length,
                childOptionIndex,
            );

            if (nextChildQuestionIndex === -1) {
                let childExitReason = `Exited child flow from Question ${parentQuestionIndex + 1}.${childQuestionIndex + 1}.`;

                if (
                    activeChildQuestion.responseType === 'multiple-choice' &&
                    !activeChildQuestion.allowMultiple &&
                    childOptionIndex !== null
                ) {
                    const selectedChildOptionTarget = Array.isArray(activeChildQuestion.optionBranching)
                        ? activeChildQuestion.optionBranching[childOptionIndex] ?? activeChildQuestion.branching
                        : activeChildQuestion.branching;

                    if (isBranchingEndTarget(selectedChildOptionTarget)) {
                        childExitReason = `Exited child flow at Question ${parentQuestionIndex + 1}.${childQuestionIndex + 1} via "If option ${childOptionIndex + 1} is picked, go to: Exit Child Questions".`;
                    }
                } else if (isBranchingEndTarget(activeChildQuestion.branching)) {
                    childExitReason = `Exited child flow at Question ${parentQuestionIndex + 1}.${childQuestionIndex + 1} via "After answer has been submitted, go to: Exit Child Questions".`;
                }

                const nextParentQuestionIndex = resolveNextParentQuestionIndexFromTarget(
                    followUpBranching,
                    parentQuestionIndex,
                    values.questions.length,
                );

                const parentFollowUpEndReason = isBranchingEndTarget(followUpBranching)
                    ? `${childExitReason} Then ended by "After child questions, go to: End Survey".`
                    : undefined;

                return moveToParentQuestion(
                    nextParentQuestionIndex,
                    parentFollowUpEndReason,
                );
            }

            const nextChildQuestion = savedChildQuestions[nextChildQuestionIndex];
            if (!nextChildQuestion) {
                const nextParentQuestionIndex = resolveNextParentQuestionIndexFromTarget(
                    followUpBranching,
                    parentQuestionIndex,
                    values.questions.length,
                );

                const parentFollowUpEndReason = isBranchingEndTarget(followUpBranching)
                    ? `Flow ended by "After child questions, go to: End Survey" after child questions of Question ${parentQuestionIndex + 1}.`
                    : undefined;

                return moveToParentQuestion(
                    nextParentQuestionIndex,
                    parentFollowUpEndReason,
                );
            }

            updatedMessages.push({
                id: nextSimulatorMessageId(),
                sender: 'system',
                text: buildSimulatorChildQuestionText(nextChildQuestion),
            });

            return {
                started: true,
                activeNode: {
                    kind: 'child',
                    parentQuestionIndex,
                    optionIndex,
                    childQuestionIndex: nextChildQuestionIndex,
                    followUpBranching,
                },
                messages: updatedMessages,
            };
        });

        setSimulatorInput('');
    };

    const handleDeleteQuestion = (): void => {
        if (deleteConfirmation.questionIndex !== null) {
            const newQuestions = values.questions.filter(
                (_: Question, index: number) =>
                    index !== deleteConfirmation.questionIndex,
            );

            if (newQuestions.length === 0) {
                setFieldValue('questions', [
                    {
                        question: '',
                        responseType: 'free-text',
                        options: [],
                        optionSaveStates: [],
                        allowMultiple: false,
                        freeTextDescription: '',
                        isSaved: true,
                        isSaving: false,
                        isEditing: false,
                        branching: null,
                    },
                ]);
            } else {
                setFieldValue('questions', newQuestions);
            }
        }

        setDeleteConfirmation({
            isOpen: false,
            questionIndex: null,
        });
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
                <div className="space-y-6">
                    <SurveyStepIntroCard
                        title="Create Questions"
                        description="Design your survey flow by defining each question and where participants go next."
                    />

                    {values.questions.map((question: Question, index: number) => (
                        <SurveyQuestionCard
                            key={index}
                            questionNumber={index + 1}
                            responseType={question.responseType}
                        >
                            <SurveyQuestionMainFields
                                index={index}
                                isSaved={Boolean(question.isSaved)}
                                onMarkEditing={() => {
                                    setFieldValue(`questions[${index}].isEditing`, true);
                                }}
                            />

                            {question.responseType === 'multiple-choice' && question.isSaved ? (
                                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="mb-3">
                                        <label className="text-sm font-medium text-slate-700">Options</label>
                                    </div>

                                    <div className="mb-4 flex items-center space-x-2">
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

                                    <div className="space-y-3">
                                        {question.options.map((option: string, optionIndex: number) => (
                                            <SurveyQuestionOptionRow
                                                key={optionIndex}
                                                optionIndex={optionIndex}
                                                optionValue={option}
                                                questionIndex={index}
                                                questionCount={values.questions.length}
                                                allowMultiple={Boolean(question.allowMultiple)}
                                                isOptionSaved={Boolean(question.optionSaveStates?.[optionIndex])}
                                                branchingFieldName={`questions[${index}].branching[${optionIndex}]`}
                                                childQuestionsButtonLabel={(() => {
                                                    const optionStateKey = childQuestionStateKey(index, optionIndex);
                                                    const optionChildState = childQuestionStates[optionStateKey];
                                                    const savedChildQuestionsCount = optionChildState
                                                        ? optionChildState.childQuestions.filter((childQuestion) => childQuestion.isSaved).length
                                                        : 0;

                                                    return savedChildQuestionsCount > 0
                                                        ? `${savedChildQuestionsCount} Child Question${savedChildQuestionsCount > 1 ? 's' : ''}`
                                                        : 'Add Child Questions';
                                                })()}
                                                onRemove={() => {
                                                    const newOptions = question.options.filter((_, optionPosition: number) => optionPosition !== optionIndex);
                                                    const newOptionSaveStates = (question.optionSaveStates ?? []).filter((_, optionPosition: number) => optionPosition !== optionIndex);
                                                    setFieldValue(`questions[${index}].options`, newOptions);
                                                    setFieldValue(`questions[${index}].optionSaveStates`, newOptionSaveStates);
                                                }}
                                                onOptionChange={(value) => {
                                                    const nextOptions = [...question.options];
                                                    nextOptions[optionIndex] = value;

                                                    const nextOptionSaveStates = [...(question.optionSaveStates ?? [])];
                                                    nextOptionSaveStates[optionIndex] = false;

                                                    setFieldValue(`questions[${index}].options`, nextOptions);
                                                    setFieldValue(`questions[${index}].optionSaveStates`, nextOptionSaveStates);
                                                }}
                                                onSaveOption={() => {
                                                    const nextOptionSaveStates = [...(question.optionSaveStates ?? [])];
                                                    nextOptionSaveStates[optionIndex] = true;
                                                    setFieldValue(`questions[${index}].optionSaveStates`, nextOptionSaveStates);
                                                }}
                                                onOpenChildQuestions={() => {
                                                    const optionStateKey = childQuestionStateKey(index, optionIndex);
                                                    const defaultOptionState = createDefaultChildQuestionState(index, optionIndex);
                                                    setChildQuestionStates((previousState) => {
                                                        if (previousState[optionStateKey]) {
                                                            return previousState;
                                                        }

                                                        return {
                                                            ...previousState,
                                                            [optionStateKey]: defaultOptionState,
                                                        };
                                                    });
                                                    setActiveChildQuestionModal({
                                                        questionIndex: index,
                                                        optionIndex,
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                const newOptions = [...question.options, ''];
                                                const newOptionSaveStates = [...(question.optionSaveStates ?? []), false];
                                                setFieldValue(`questions[${index}].options`, newOptions);
                                                setFieldValue(`questions[${index}].optionSaveStates`, newOptionSaveStates);
                                            }}
                                            className="h-9 border-blue-300 bg-white text-blue-600 hover:bg-blue-50"
                                        >
                                            Add Option
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {question.responseType === 'free-text' ? (
                                <div className="mt-5 space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Explanation (Optional)</label>
                                    <textarea
                                        value=""
                                        readOnly
                                        disabled
                                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                                        placeholder="Participants will give an open-ended answer..."
                                    />
                                </div>
                            ) : null}

                            {(question.responseType !== 'multiple-choice' || question.allowMultiple) ? (
                                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        {question.responseType === 'multiple-choice' && question.allowMultiple
                                            ? 'After all Child Questions have been answered, go to:'
                                            : 'After answer has been submitted, go to:'}
                                    </label>
                                    <SurveyBranchingSelect
                                        name={`questions[${index}].branching`}
                                        currentQuestionIndex={index}
                                        questionCount={values.questions.length}
                                        noMoreLabel="-- No questions --"
                                    />
                                </div>
                            ) : null}

                            <SurveyQuestionFooterActions
                                questionLength={question.question?.length || 0}
                                isEditing={Boolean(question.isEditing)}
                                isSaved={Boolean(question.isSaved)}
                                isSaving={Boolean(question.isSaving)}
                                onSave={async () => {
                                    if (!question.question) {
                                        setFieldValue(`questions[${index}].isEditing`, true);
                                        return;
                                    }

                                    if (
                                        question.responseType === 'multiple-choice' &&
                                        question.options.length === 0
                                    ) {
                                        setFieldValue(`questions[${index}].options`, ['']);
                                        setFieldValue(`questions[${index}].optionSaveStates`, [false]);
                                    }

                                    setFieldValue(`questions[${index}].isSaving`, true);
                                    await new Promise((resolve) => setTimeout(resolve, 1000));
                                    setFieldValue(`questions[${index}].isSaving`, false);
                                    setFieldValue(`questions[${index}].isSaved`, true);
                                    setFieldValue(`questions[${index}].isEditing`, false);
                                }}
                                onDelete={() => {
                                    setDeleteConfirmation({
                                        isOpen: true,
                                        questionIndex: index,
                                    });
                                }}
                            />
                        </SurveyQuestionCard>
                    ))}

                    {canAddNewQuestion ? (
                        <div className="flex items-center justify-end">
                            <Button
                                type="button"
                                onClick={() => {
                                    const newQuestion = {
                                        question: '',
                                        responseType: 'free-text',
                                        options: [],
                                        optionSaveStates: [],
                                        allowMultiple: false,
                                        freeTextDescription: '',
                                        isSaved: true,
                                        isSaving: false,
                                        isEditing: false,
                                        branching: null,
                                    };
                                    setFieldValue('questions', [...values.questions, newQuestion]);
                                }}
                                className="h-10 px-5"
                            >
                                Add New Question
                            </Button>
                        </div>
                    ) : null}
                </div>

                <div className="self-start lg:sticky lg:top-4">
                    <SurveySimulatorPanel
                        shortCode={previewShortCode}
                        messages={simulatorSession.messages.map((message) => ({
                            ...message,
                            text: !simulatorSession.started && message.id === 1
                                ? simulatorPromptText
                                : message.text,
                        }))}
                        hasPreviewQuestion={Boolean(previewQuestion?.question)}
                        inputValue={simulatorInput}
                        onReset={resetSimulator}
                        onSend={handleSimulatorSend}
                        onInputChange={(value) => {
                            setSimulatorInput(value);
                        }}
                        onInputEnter={handleSimulatorSend}
                    />
                </div>
            </div>

            {activeChildQuestionModal ? (
                <ChildQuestionsModal
                    isOpen={activeChildQuestionModal !== null}
                    onClose={() => {
                        setActiveChildQuestionModal(null);
                    }}
                    parentQuestionNumber={activeChildQuestionModal.questionIndex + 1}
                    optionNumber={activeChildQuestionModal.optionIndex + 1}
                    optionText={
                        values.questions[activeChildQuestionModal.questionIndex]?.options[activeChildQuestionModal.optionIndex] ?? ''
                    }
                    initialState={
                        childQuestionStates[
                            childQuestionStateKey(
                                activeChildQuestionModal.questionIndex,
                                activeChildQuestionModal.optionIndex,
                            )
                        ] ?? createDefaultChildQuestionState(
                            activeChildQuestionModal.questionIndex,
                            activeChildQuestionModal.optionIndex,
                        )
                    }
                    onSaveState={(savedState) => {
                        const stateKey = childQuestionStateKey(
                            activeChildQuestionModal.questionIndex,
                            activeChildQuestionModal.optionIndex,
                        );

                        setChildQuestionStates((previousState) => {
                            return {
                                ...previousState,
                                [stateKey]: savedState,
                            };
                        });

                        setFieldValue(
                            `questions[${activeChildQuestionModal.questionIndex}].branching[${activeChildQuestionModal.optionIndex}]`,
                            savedState.followUpBranching,
                        );
                    }}
                    availableTargets={values.questions.map((questionItem: Question, questionItemIndex: number) => {
                        return {
                            value: String(questionItemIndex),
                            label: `Question ${questionItemIndex + 1}`,
                        };
                    })}
                />
            ) : null}

            <DeleteConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onConfirm={handleDeleteQuestion}
                onCancel={() => setDeleteConfirmation({
                    isOpen: false,
                    questionIndex: null,
                })}
            />
        </>
    );
}
