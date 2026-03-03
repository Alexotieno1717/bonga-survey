import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    CalendarDays,
    CircleCheckBig,
    CircleDotDashed,
    Clock3,
    FileQuestion,
    MessageSquareText,
    Milestone,
    MoveLeft,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import AppLayout from '@/layouts/app-layout';
import questions from '@/routes/questions';
import surveysRoutes from '@/routes/surveys';
import type { BreadcrumbItem } from '@/types';

type SurveyStatus = 'draft' | 'active' | 'completed' | 'cancelled';

interface SurveyOption {
    id: number;
    option: string | null;
    order: number;
    branching: unknown;
}

interface PersistedChildOption {
    option: string;
    order: number;
    go_to: unknown;
}

interface PersistedChildQuestion {
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    allow_multiple: boolean;
    order: number;
    after_answer_go_to: unknown;
    options?: PersistedChildOption[];
}

interface OptionBranchingMetadata {
    next_question: unknown;
    follow_up_after_children: unknown;
    child_questions: PersistedChildQuestion[];
}

interface SurveyQuestion {
    id: number;
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    free_text_description: string | null;
    allow_multiple: boolean;
    order: number;
    branching: unknown;
    options: SurveyOption[];
}

interface SurveyDetails {
    id: number;
    name: string;
    description: string;
    trigger_word: string;
    invitation_message: string;
    completion_message: string | null;
    start_date: string;
    end_date: string;
    scheduled_time: string | null;
    status: SurveyStatus;
    created_at: string;
    sent_recipients_count: number;
    questions: SurveyQuestion[];
}

interface QuestionEditState {
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    free_text_description: string;
    allow_multiple: boolean;
    options: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Survey Details',
        href: questions.index().url,
    },
];

function statusVariant(status: SurveyStatus): 'default' | 'secondary' | 'outline' {
    if (status === 'active') {
        return 'default';
    }

    if (status === 'completed') {
        return 'secondary';
    }

    return 'outline';
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Not set';
    }

    return format(new Date(value), 'MMM d, yyyy');
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Not scheduled';
    }

    return format(new Date(value), 'MMM d, yyyy, h:mm a');
}

function formatBranching(branching: unknown): string {
    if (branching === null || branching === undefined) {
        return 'Next question';
    }

    if (Array.isArray(branching)) {
        return `Custom branching (${branching.length})`;
    }

    if (typeof branching === 'object') {
        return 'Custom branching';
    }

    return `Next: ${String(branching)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function parseOptionBranchingMetadata(branching: unknown): OptionBranchingMetadata | null {
    if (!isRecord(branching)) {
        return null;
    }

    const childQuestions = Array.isArray(branching.child_questions)
        ? (branching.child_questions as PersistedChildQuestion[])
        : [];

    return {
        next_question: branching.next_question ?? null,
        follow_up_after_children: branching.follow_up_after_children ?? null,
        child_questions: childQuestions,
    };
}

function formatParentBranchingTarget(target: unknown): string {
    if (target === null || target === undefined || target === '') {
        return 'Not set';
    }

    const numericTarget = Number(target);
    if (!Number.isNaN(numericTarget)) {
        if (numericTarget === -1) {
            return 'End Survey';
        }

        if (numericTarget === 0) {
            return 'Next Question, if added';
        }

        return `Question ${numericTarget + 1}`;
    }

    return String(target);
}

function formatChildBranchingTarget(target: unknown, parentQuestionNumber: number): string {
    if (target === null || target === undefined || target === '') {
        return 'Not set';
    }

    const numericTarget = Number(target);
    if (!Number.isNaN(numericTarget)) {
        if (numericTarget === -1) {
            return 'Exit Child Questions';
        }

        if (numericTarget === 0) {
            return 'Next Question, if added';
        }

        return `Question ${parentQuestionNumber}.${numericTarget}`;
    }

    return String(target);
}

function buildEditState(question: SurveyQuestion): QuestionEditState {
    return {
        question: question.question,
        response_type: question.response_type,
        free_text_description: question.free_text_description ?? '',
        allow_multiple: question.allow_multiple,
        options: [...question.options]
            .sort((a, b) => a.order - b.order)
            .map((option) => option.option ?? ''),
    };
}

export default function Show() {
    const { survey } = usePage().props as unknown as { survey: SurveyDetails };
    const canEditSurvey = survey.status === 'draft' && survey.sent_recipients_count === 0;
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [questionEditState, setQuestionEditState] = useState<QuestionEditState | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const beginQuestionEdit = (question: SurveyQuestion): void => {
        setEditingQuestionId(question.id);
        setQuestionEditState(buildEditState(question));
    };

    const cancelQuestionEdit = (): void => {
        setEditingQuestionId(null);
        setQuestionEditState(null);
    };

    const saveQuestionEdit = (questionId: number): void => {
        if (!questionEditState || !canEditSurvey) {
            return;
        }

        router.put(
            surveysRoutes.questions.update([survey.id, questionId]).url,
            {
                question: questionEditState.question,
                response_type: questionEditState.response_type,
                free_text_description: questionEditState.free_text_description,
                allow_multiple: questionEditState.allow_multiple,
                options: questionEditState.options.map((option) => ({ option })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    cancelQuestionEdit();
                },
            },
        );
    };

    const deleteSurvey = (): void => {
        setIsDeleteDialogOpen(true);
    };

    const cancelSurvey = (): void => {
        if (!window.confirm('Cancel this survey? You can no longer continue publishing it.')) {
            return;
        }

        router.patch(surveysRoutes.cancel(survey.id).url);
    };

    const reactivateSurvey = (): void => {
        if (!window.confirm('Reactivate this survey?')) {
            return;
        }

        router.patch(surveysRoutes.reactivate(survey.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Survey: ${survey.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={questions.index().url}>
                                    <Button
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25"
                                    >
                                        <MoveLeft className="mr-2 h-4 w-4" />
                                        Back to Surveys
                                    </Button>
                                </Link>
                                <Link href={surveysRoutes.responses(survey.id).url}>
                                    <Button
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25"
                                    >
                                        View Responses
                                    </Button>
                                </Link>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="bg-red-500/80 text-white hover:bg-red-500"
                                    onClick={deleteSurvey}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Survey
                                </Button>
                                {(survey.status === 'draft' || survey.status === 'active') ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-amber-500/80 text-white hover:bg-amber-500"
                                        onClick={cancelSurvey}
                                    >
                                        Cancel Survey
                                    </Button>
                                ) : null}
                                {survey.status === 'cancelled' ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-emerald-500/80 text-white hover:bg-emerald-500"
                                        onClick={reactivateSurvey}
                                    >
                                        Reactivate Survey
                                    </Button>
                                ) : null}
                            </div>

                            <Badge
                                variant={statusVariant(survey.status)}
                                className="border-white/30 bg-white/15 text-white capitalize"
                            >
                                {survey.status}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {survey.name}
                            </h1>
                            <p className="max-w-3xl text-sm text-slate-200">
                                {survey.description}
                            </p>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-3">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                Start Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{formatDate(survey.start_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                End Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{formatDate(survey.end_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                Scheduled Send
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {formatDateTime(survey.scheduled_time)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileQuestion className="h-4 w-4" />
                                Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">
                                {survey.questions.length} total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Milestone className="h-4 w-4" />
                                Trigger Word
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="text-sm uppercase">
                                {survey.trigger_word}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquareText className="h-4 w-4" />
                                Invitation Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {survey.invitation_message}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {survey.completion_message ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CircleCheckBig className="h-4 w-4" />
                                Completion Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {survey.completion_message}
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Survey Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {survey.questions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No questions available for this survey.
                            </div>
                        ) : (
                            [...survey.questions]
                                .sort((a, b) => a.order - b.order)
                                .map((question, index) => {
                                    const isEditingCurrent = editingQuestionId === question.id && questionEditState !== null;

                                    return (
                                        <div
                                            key={question.id}
                                            className="rounded-xl border bg-muted/20 p-4"
                                        >
                                            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Question {index + 1}
                                                    </p>
                                                    {isEditingCurrent ? (
                                                        <input
                                                            type="text"
                                                            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                                                            value={questionEditState.question}
                                                            onChange={(event) => {
                                                                setQuestionEditState({
                                                                    ...questionEditState,
                                                                    question: event.target.value,
                                                                });
                                                            }}
                                                        />
                                                    ) : (
                                                        <h3 className="text-base font-semibold">
                                                            {question.question}
                                                        </h3>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isEditingCurrent ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={cancelQuestionEdit}
                                                            >
                                                                <X className="mr-2 h-4 w-4" />
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => {
                                                                    saveQuestionEdit(question.id);
                                                                }}
                                                            >
                                                                <Save className="mr-2 h-4 w-4" />
                                                                Save
                                                            </Button>
                                                        </>
                                                    ) : canEditSurvey ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                beginQuestionEdit(question);
                                                            }}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="outline">Locked</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {isEditingCurrent ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <label className="text-sm font-medium text-muted-foreground">
                                                            Response Type
                                                        </label>
                                                        <select
                                                            className="rounded-md border bg-white px-3 py-2 text-sm"
                                                            value={questionEditState.response_type}
                                                            onChange={(event) => {
                                                                const nextType = event.target.value as 'free-text' | 'multiple-choice';

                                                                setQuestionEditState({
                                                                    ...questionEditState,
                                                                    response_type: nextType,
                                                                    allow_multiple: nextType === 'multiple-choice'
                                                                        ? questionEditState.allow_multiple
                                                                        : false,
                                                                });
                                                            }}
                                                        >
                                                            <option value="free-text">free-text</option>
                                                            <option value="multiple-choice">multiple-choice</option>
                                                        </select>

                                                        {questionEditState.response_type === 'multiple-choice' ? (
                                                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={questionEditState.allow_multiple}
                                                                    onChange={(event) => {
                                                                        setQuestionEditState({
                                                                            ...questionEditState,
                                                                            allow_multiple: event.target.checked,
                                                                        });
                                                                    }}
                                                                />
                                                                Multi-select
                                                            </label>
                                                        ) : null}
                                                    </div>

                                                    {questionEditState.response_type === 'multiple-choice' ? (
                                                        <div className="space-y-2">
                                                            {questionEditState.options.map((option, optionIndex) => (
                                                                <div key={optionIndex} className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                                                                        value={option}
                                                                        onChange={(event) => {
                                                                            const nextOptions = [...questionEditState.options];
                                                                            nextOptions[optionIndex] = event.target.value;

                                                                            setQuestionEditState({
                                                                                ...questionEditState,
                                                                                options: nextOptions,
                                                                            });
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setQuestionEditState({
                                                                                ...questionEditState,
                                                                                options: questionEditState.options.filter((_, indexToKeep) => indexToKeep !== optionIndex),
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setQuestionEditState({
                                                                        ...questionEditState,
                                                                        options: [...questionEditState.options, ''],
                                                                    });
                                                                }}
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add Option
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            rows={3}
                                                            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                                                            value={questionEditState.free_text_description}
                                                            onChange={(event) => {
                                                                setQuestionEditState({
                                                                    ...questionEditState,
                                                                    free_text_description: event.target.value,
                                                                });
                                                            }}
                                                            placeholder="Participant will provide an open-ended text response."
                                                        />
                                                    )}
                                                </div>
                                            ) : question.response_type === 'multiple-choice' ? (
                                                <div className="space-y-2">
                                                    {question.options.length > 0 ? (
                                                        [...question.options]
                                                            .sort((a, b) => a.order - b.order)
                                                            .map((option, optionIndex) => (
                                                                <div
                                                                    key={option.id}
                                                                    className="space-y-3 rounded-md border bg-white px-3 py-2"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-sm">
                                                                            {optionIndex + 1}. {option.option}
                                                                        </span>
                                                                        <Badge variant="outline">
                                                                            {formatBranching(option.branching)}
                                                                        </Badge>
                                                                    </div>

                                                                    {(() => {
                                                                        const optionBranchingMetadata = parseOptionBranchingMetadata(option.branching);
                                                                        if (!optionBranchingMetadata || optionBranchingMetadata.child_questions.length === 0) {
                                                                            return null;
                                                                        }

                                                                        const sortedChildQuestions = [...optionBranchingMetadata.child_questions]
                                                                            .sort((first, second) => first.order - second.order);

                                                                        return (
                                                                            <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3">
                                                                                <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
                                                                                    Child Questions ({sortedChildQuestions.length})
                                                                                </p>

                                                                                <div className="mt-2 space-y-2">
                                                                                    {sortedChildQuestions.map((childQuestion, childQuestionIndex) => (
                                                                                        <div
                                                                                            key={`${option.id}-child-${childQuestionIndex}`}
                                                                                            className="rounded-md border border-violet-100 bg-white p-3"
                                                                                        >
                                                                                            <p className="text-sm font-medium text-slate-900">
                                                                                                Question {index + 1}.{childQuestionIndex + 1}
                                                                                            </p>
                                                                                            <p className="mt-1 text-sm text-slate-700">
                                                                                                {childQuestion.question}
                                                                                            </p>
                                                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                                                <Badge variant="outline">
                                                                                                    {childQuestion.response_type}
                                                                                                </Badge>
                                                                                                <span>
                                                                                                    After answer: {formatChildBranchingTarget(childQuestion.after_answer_go_to, index + 1)}
                                                                                                </span>
                                                                                            </div>

                                                                                            {childQuestion.response_type === 'multiple-choice' && childQuestion.options && childQuestion.options.length > 0 ? (
                                                                                                <div className="mt-2 space-y-1">
                                                                                                    {childQuestion.options
                                                                                                        .sort((first, second) => first.order - second.order)
                                                                                                        .map((childOption, childOptionIndex) => (
                                                                                                            <div
                                                                                                                key={`${option.id}-child-${childQuestionIndex}-option-${childOptionIndex}`}
                                                                                                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                                                                                                            >
                                                                                                                <span>
                                                                                                                    {childOptionIndex + 1}. {childOption.option}
                                                                                                                </span>
                                                                                                                <span className="text-slate-500">
                                                                                                                    Go to: {formatChildBranchingTarget(childOption.go_to, index + 1)}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                            ) : null}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>

                                                                                <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                                                                    After all child questions:
                                                                                    {' '}
                                                                                    {formatParentBranchingTarget(optionBranchingMetadata.follow_up_after_children)}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            No options configured.
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground">
                                                    {question.free_text_description ||
                                                        'Participant will provide an open-ended text response.'}
                                                </div>
                                            )}

                                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                <CircleDotDashed className="h-3.5 w-3.5" />
                                                <span>
                                                    Branching: {formatBranching(question.branching)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </CardContent>
                </Card>
                <DeleteConfirmationDialog
                    isOpen={isDeleteDialogOpen}
                    title="Delete Survey"
                    description="Are you sure you want to delete this survey? This action cannot be undone."
                    onConfirm={() => {
                        router.delete(surveysRoutes.destroy(survey.id).url);
                        setIsDeleteDialogOpen(false);
                    }}
                    onCancel={() => {
                        setIsDeleteDialogOpen(false);
                    }}
                />
            </div>
        </AppLayout>
    );
}
