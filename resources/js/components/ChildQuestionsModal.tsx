import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Trash2, TriangleAlert, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface ChildQuestionDraft {
    id: number;
    question: string;
    responseType: 'free-text' | 'multiple-choice';
    branching: string;
    options: string[];
    optionSaveStates: boolean[];
    optionBranching: string[];
    allowMultiple: boolean;
    isSaved: boolean;
}

export interface ChildQuestionOptionState {
    childQuestions: ChildQuestionDraft[];
    followUpBranching: string;
}

interface ChildQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentQuestionNumber: number;
    optionNumber: number;
    optionText: string;
    initialState: ChildQuestionOptionState;
    onSaveState: (state: ChildQuestionOptionState) => void;
    availableTargets: Array<{ value: string; label: string }>;
}

const createEmptyChildQuestion = (id: number): ChildQuestionDraft => {
    return {
        id,
        question: '',
        responseType: 'free-text',
        branching: '0',
        options: [],
        optionSaveStates: [],
        optionBranching: [],
        allowMultiple: false,
        isSaved: false,
    };
};

export default function ChildQuestionsModal({
    isOpen,
    onClose,
    parentQuestionNumber,
    optionNumber,
    optionText,
    initialState,
    onSaveState,
    availableTargets,
}: ChildQuestionsModalProps) {
    const [localState, setLocalState] = useState<ChildQuestionOptionState>(initialState);

    const nextChildId = (): number => {
        if (localState.childQuestions.length === 0) {
            return 1;
        }

        return Math.max(...localState.childQuestions.map((question) => question.id)) + 1;
    };

    const updateChildQuestion = (
        childQuestionIndex: number,
        updates: Partial<ChildQuestionDraft>,
    ): void => {
        setLocalState((previousState) => {
            const nextQuestions = [...previousState.childQuestions];
            nextQuestions[childQuestionIndex] = {
                ...nextQuestions[childQuestionIndex],
                ...updates,
            };

            return {
                ...previousState,
                childQuestions: nextQuestions,
            };
        });
    };

    const saveChildQuestion = (childQuestionIndex: number): void => {
        const childQuestion = localState.childQuestions[childQuestionIndex];

        if (!childQuestion || childQuestion.question.trim().length === 0) {
            return;
        }

        if (childQuestion.responseType === 'multiple-choice') {
            const hasValidOptions = childQuestion.options.length > 0 &&
                childQuestion.options.every((option) => option.trim().length > 0) &&
                childQuestion.options.every((_, optionIndex) => Boolean(childQuestion.optionSaveStates[optionIndex]));
            if (!hasValidOptions) {
                return;
            }
        }

        updateChildQuestion(childQuestionIndex, {
            isSaved: true,
        });
    };

    const removeChildQuestion = (childQuestionIndex: number): void => {
        setLocalState((previousState) => {
            const nextQuestions = previousState.childQuestions.filter((_, index) => index !== childQuestionIndex);

            return {
                ...previousState,
                childQuestions: nextQuestions.length > 0 ? nextQuestions : [createEmptyChildQuestion(1)],
            };
        });
    };

    const addChildQuestion = (): void => {
        setLocalState((previousState) => {
            return {
                ...previousState,
                childQuestions: [...previousState.childQuestions, createEmptyChildQuestion(nextChildId())],
            };
        });
    };

    const closeWithSave = (): void => {
        onSaveState(localState);
        onClose();
    };

    const canAddChildQuestion = localState.childQuestions.every((childQuestion) => {
        if (!childQuestion.isSaved || childQuestion.question.trim().length === 0) {
            return false;
        }

        if (childQuestion.responseType !== 'multiple-choice') {
            return true;
        }

        return childQuestion.options.length > 0 &&
            childQuestion.options.every((option) => option.trim().length > 0) &&
            childQuestion.options.every((_, optionIndex) => Boolean(childQuestion.optionSaveStates[optionIndex]));
    });

    return (
        <Dialog open={isOpen} onClose={closeWithSave} className="relative z-50">
            <div className="fixed inset-0 bg-slate-900/50" />
            <div className="fixed inset-0 flex">
                <DialogPanel className="h-full w-full max-w-2xl overflow-y-auto border-r border-slate-200 bg-white shadow-xl">
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <DialogTitle className="text-base font-semibold text-slate-800">
                                Child Questions for
                                {' '}
                                <span className="text-violet-600">Option {optionNumber}: "{optionText || `Option ${optionNumber}`}"</span>
                                {' '}
                                of Question
                                {' '}
                                {parentQuestionNumber}
                            </DialogTitle>
                            <button
                                type="button"
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                onClick={closeWithSave}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5 px-5 py-5">
                        {localState.childQuestions.map((childQuestion, index) => (
                            <div key={childQuestion.id} className="rounded-xl border border-slate-200 bg-white">
                                <div className="p-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">
                                                Question {parentQuestionNumber}.{index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={childQuestion.question}
                                                onChange={(event) => {
                                                    updateChildQuestion(index, {
                                                        question: event.target.value,
                                                        isSaved: false,
                                                    });
                                                }}
                                                placeholder="Add a survey question"
                                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Response type</label>
                                            <select
                                                value={childQuestion.responseType}
                                                onChange={(event) => {
                                                    const nextResponseType = event.target.value as 'free-text' | 'multiple-choice';
                                                    updateChildQuestion(index, {
                                                        responseType: nextResponseType,
                                                        options: nextResponseType === 'multiple-choice'
                                                            ? (childQuestion.options.length > 0 ? childQuestion.options : [''])
                                                        : [],
                                                        optionSaveStates: nextResponseType === 'multiple-choice'
                                                            ? (childQuestion.optionSaveStates.length > 0 ? childQuestion.optionSaveStates : [false])
                                                            : [],
                                                        optionBranching: nextResponseType === 'multiple-choice'
                                                            ? (childQuestion.optionBranching.length > 0 ? childQuestion.optionBranching : ['0'])
                                                            : [],
                                                        isSaved: false,
                                                    });
                                                }}
                                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                                            >
                                                <option value="free-text">Free text</option>
                                                <option value="multiple-choice">Multiple Choice</option>
                                            </select>
                                        </div>
                                    </div>

                                    {childQuestion.responseType === 'free-text' ? (
                                        <textarea
                                            value=""
                                            disabled
                                            readOnly
                                            className="mt-3 min-h-[88px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                            placeholder="Participants will give an open-ended answer ..."
                                        />
                                    ) : (
                                        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-slate-700">Options</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        id={`allow-multiple-${childQuestion.id}`}
                                                        type="checkbox"
                                                        checked={childQuestion.allowMultiple}
                                                        onChange={(event) => {
                                                            updateChildQuestion(index, {
                                                                allowMultiple: event.target.checked,
                                                                isSaved: false,
                                                            });
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                                                    />
                                                    <label
                                                        htmlFor={`allow-multiple-${childQuestion.id}`}
                                                        className="text-sm font-medium text-slate-700"
                                                    >
                                                        Allow participant to pick more than one option
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {childQuestion.options.map((option, optionIndex) => (
                                                    <div
                                                        key={`${childQuestion.id}-option-${optionIndex}`}
                                                        className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_220px]"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-xs font-medium text-slate-600">
                                                                    Option {optionIndex + 1}
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    className="text-xs text-rose-500 hover:text-rose-700"
                                                                    onClick={() => {
                                                                        const nextOptions = childQuestion.options.filter((_, indexToKeep) => indexToKeep !== optionIndex);
                                                                        const nextOptionBranching = childQuestion.optionBranching.filter((_, indexToKeep) => indexToKeep !== optionIndex);
                                                                        const nextOptionSaveStates = childQuestion.optionSaveStates.filter((_, indexToKeep) => indexToKeep !== optionIndex);
                                                                        updateChildQuestion(index, {
                                                                            options: nextOptions,
                                                                            optionBranching: nextOptionBranching,
                                                                            optionSaveStates: nextOptionSaveStates,
                                                                            isSaved: false,
                                                                        });
                                                                    }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(event) => {
                                                                    const nextOptions = [...childQuestion.options];
                                                                    nextOptions[optionIndex] = event.target.value;
                                                                    const nextOptionSaveStates = [...childQuestion.optionSaveStates];
                                                                    nextOptionSaveStates[optionIndex] = false;
                                                                    updateChildQuestion(index, {
                                                                        options: nextOptions,
                                                                        optionSaveStates: nextOptionSaveStates,
                                                                        isSaved: false,
                                                                    });
                                                                }}
                                                                placeholder={`Option ${optionIndex + 1}`}
                                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                                                            />
                                                        </div>

                                                        {childQuestion.optionSaveStates[optionIndex] && !childQuestion.allowMultiple ? (
                                                            <div className="space-y-1">
                                                                <label className="block text-xs font-medium text-slate-600">
                                                                    If option {optionIndex + 1} is picked, go to:
                                                                </label>
                                                                {(() => {
                                                                    const childQuestionTargets = localState.childQuestions
                                                                        .map((_, childQuestionIndex) => ({
                                                                            value: String(childQuestionIndex + 1),
                                                                            label: `Question ${parentQuestionNumber}.${childQuestionIndex + 1}`,
                                                                        }))
                                                                        .filter((_, childQuestionIndex) => childQuestionIndex !== index);

                                                                    return (
                                                                <select
                                                                    value={childQuestion.optionBranching[optionIndex] ?? '0'}
                                                                    onChange={(event) => {
                                                                        const nextOptionBranching = [...childQuestion.optionBranching];
                                                                        nextOptionBranching[optionIndex] = event.target.value;
                                                                        updateChildQuestion(index, {
                                                                            optionBranching: nextOptionBranching,
                                                                            isSaved: false,
                                                                        });
                                                                    }}
                                                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                                                                >
                                                                    <option value="0">Next Question, if added</option>
                                                                    {childQuestionTargets.map((target) => (
                                                                        <option key={target.value} value={target.value}>
                                                                            {target.label}
                                                                        </option>
                                                                    ))}
                                                                    <option value="-2" disabled>-- No Question --</option>
                                                                    <option value="-1">Exit Child Questions</option>
                                                                </select>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : childQuestion.optionSaveStates[optionIndex] ? (
                                                            <div className="h-10 w-full" />
                                                        ) : (
                                                            <div className="flex items-end">
                                                                {option.trim().length > 0 ? (
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const nextOptionSaveStates = [...childQuestion.optionSaveStates];
                                                                            nextOptionSaveStates[optionIndex] = true;
                                                                            updateChildQuestion(index, {
                                                                                optionSaveStates: nextOptionSaveStates,
                                                                                isSaved: false,
                                                                            });
                                                                        }}
                                                                        className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                                                                    >
                                                                        Save Option
                                                                    </Button>
                                                                ) : (
                                                                    <div className="h-10 w-full" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-8 border-violet-400 text-violet-700 hover:bg-violet-50"
                                                    onClick={() => {
                                                        const nextOptions = [...childQuestion.options, ''];
                                                        const nextOptionBranching = [...childQuestion.optionBranching, '0'];
                                                        const nextOptionSaveStates = [...childQuestion.optionSaveStates, false];
                                                        updateChildQuestion(index, {
                                                            options: nextOptions,
                                                            optionBranching: nextOptionBranching,
                                                            optionSaveStates: nextOptionSaveStates,
                                                            isSaved: false,
                                                        });
                                                    }}
                                                >
                                                    Add Option
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-200 px-4 py-3">
                                    {(childQuestion.responseType !== 'multiple-choice' || childQuestion.allowMultiple) ? (
                                        <>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                After answer has been submitted, go to:
                                            </label>
                                            {(() => {
                                                const nextChildTargets = localState.childQuestions
                                                    .map((question, questionIndex) => ({ question, questionIndex }))
                                                    .filter(({ questionIndex }) => questionIndex > index)
                                                    .map(({ questionIndex }) => ({
                                                        value: String(questionIndex + 1),
                                                        label: `Question ${parentQuestionNumber}.${questionIndex + 1}`,
                                                    }));

                                                return (
                                                    <select
                                                        value={childQuestion.branching}
                                                        onChange={(event) => {
                                                            updateChildQuestion(index, {
                                                                branching: event.target.value,
                                                                isSaved: false,
                                                            });
                                                        }}
                                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                                                    >
                                                        <option value="0">Next Question, if added</option>
                                                        {nextChildTargets.map((target) => (
                                                            <option key={target.value} value={target.value}>
                                                                {target.label}
                                                            </option>
                                                        ))}
                                                        <option value="-2" disabled>-- No More Questions --</option>
                                                        <option value="-1">Exit Child Questions</option>
                                                    </select>
                                                );
                                            })()}
                                        </>
                                    ) : null}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                                    <div>
                                        {childQuestion.isSaved ? (
                                            <p className="text-sm text-slate-500">
                                                ~{childQuestion.question.length} characters. 1 message(s). GSM 7 Encoding.
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-rose-500">
                                                <TriangleAlert className="h-4 w-4" />
                                                <span>Question Not Saved</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {childQuestion.isSaved ? (
                                            <button
                                                type="button"
                                                onClick={() => removeChildQuestion(index)}
                                                className="rounded-md border border-slate-300 p-2 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={() => saveChildQuestion(index)}
                                                className="h-9 bg-violet-600 text-white hover:bg-violet-700"
                                            >
                                                Save
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {canAddChildQuestion ? (
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addChildQuestion}
                                    className="border-violet-400 text-violet-700 hover:bg-violet-50"
                                >
                                    Add Child Question
                                </Button>
                            </div>
                        ) : null}

                        <div className="border-t border-slate-200 pt-5">
                            <h3 className="text-base font-semibold text-slate-700">Follow up question</h3>
                            <label className="mt-2 mb-1.5 block text-sm font-medium text-slate-600">
                                After all the child questions above have been answered, go to:
                            </label>
                            <select
                                value={localState.followUpBranching}
                                onChange={(event) => {
                                    setLocalState((previousState) => {
                                        return {
                                            ...previousState,
                                            followUpBranching: event.target.value,
                                        };
                                    });
                                }}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:outline-none"
                            >
                                <option value="0">Next Question, if added</option>
                                {availableTargets.map((target) => (
                                    <option key={target.value} value={target.value}>
                                        {target.label}
                                    </option>
                                ))}
                                <option value="-2" disabled>-- No Question --</option>
                                <option value="-1">Exit Child Questions</option>
                            </select>
                        </div>
                    </div>

                    <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-3">
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={closeWithSave}>
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
