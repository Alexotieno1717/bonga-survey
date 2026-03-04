import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    CalendarDays,
    CircleDotDashed,
    Clock3,
    FileQuestion,
    MoveLeft,
    Pencil,
    Plus,
    Save,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface NewQuestionState {
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    free_text_description: string;
    allow_multiple: boolean;
    options: string[];
    branching: string;
}

interface SurveyDetailsEditState {
    surveyName: string;
    description: string;
    startDate: string;
    endDate: string;
    triggerWord: string;
    invitationMessage: string;
    completionMessage: string;
    scheduleTime: string;
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

function statusPillClass(status: SurveyStatus): string {
    if (status === 'active') {
        return 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100';
    }

    if (status === 'completed') {
        return 'border-blue-300/40 bg-blue-400/15 text-blue-100';
    }

    if (status === 'cancelled') {
        return 'border-rose-300/40 bg-rose-400/15 text-rose-100';
    }

    return 'border-amber-300/40 bg-amber-300/15 text-amber-100';
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

function buildEmptyQuestionState(): NewQuestionState {
    return {
        question: '',
        response_type: 'free-text',
        free_text_description: '',
        allow_multiple: false,
        options: [''],
        branching: '0',
    };
}

function toDateInputValue(value: string | null): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

function toDateTimeLocalInputValue(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const timezoneOffsetInMs = date.getTimezoneOffset() * 60 * 1000;
    const localDateTime = new Date(date.getTime() - timezoneOffsetInMs);

    return localDateTime.toISOString().slice(0, 16);
}

function buildSurveyDetailsEditState(survey: SurveyDetails): SurveyDetailsEditState {
    return {
        surveyName: survey.name,
        description: survey.description,
        startDate: toDateInputValue(survey.start_date),
        endDate: toDateInputValue(survey.end_date),
        triggerWord: survey.trigger_word,
        invitationMessage: survey.invitation_message ?? '',
        completionMessage: survey.completion_message ?? '',
        scheduleTime: toDateTimeLocalInputValue(survey.scheduled_time),
    };
}

export default function Show() {
    const { survey } = usePage().props as unknown as { survey: SurveyDetails };
    const canEditSurvey = survey.status === 'draft';
    const [isEditingSurveyDetails, setIsEditingSurveyDetails] = useState(false);
    const [isSavingSurveyDetails, setIsSavingSurveyDetails] = useState(false);
    const [surveyDetailsEditState, setSurveyDetailsEditState] = useState<SurveyDetailsEditState>(
        () => buildSurveyDetailsEditState(survey),
    );
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [questionEditState, setQuestionEditState] = useState<QuestionEditState | null>(null);
    const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
    const [isSavingNewQuestion, setIsSavingNewQuestion] = useState(false);
    const [newQuestionState, setNewQuestionState] = useState<NewQuestionState>(() => buildEmptyQuestionState());
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const sortedQuestions = [...survey.questions].sort((a, b) => a.order - b.order);
    const normalizedNewQuestionOptions = newQuestionState.options
        .map((option) => option.trim())
        .filter((option) => option.length > 0);
    const canSaveNewQuestion = newQuestionState.question.trim().length > 0 &&
        (
            newQuestionState.response_type !== 'multiple-choice' ||
            normalizedNewQuestionOptions.length > 0
        );

    const beginSurveyDetailsEdit = (): void => {
        setSurveyDetailsEditState(buildSurveyDetailsEditState(survey));
        setIsEditingSurveyDetails(true);
    };

    const cancelSurveyDetailsEdit = (): void => {
        setSurveyDetailsEditState(buildSurveyDetailsEditState(survey));
        setIsEditingSurveyDetails(false);
    };

    const saveSurveyDetailsEdit = (): void => {
        if (!canEditSurvey || isSavingSurveyDetails) {
            return;
        }

        router.put(
            surveysRoutes.show(survey.id).url,
            {
                surveyName: surveyDetailsEditState.surveyName,
                description: surveyDetailsEditState.description,
                startDate: surveyDetailsEditState.startDate,
                endDate: surveyDetailsEditState.endDate,
                triggerWord: surveyDetailsEditState.triggerWord,
                invitationMessage: surveyDetailsEditState.invitationMessage,
                completionMessage: surveyDetailsEditState.completionMessage,
                scheduleTime: surveyDetailsEditState.scheduleTime || null,
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setIsSavingSurveyDetails(true);
                },
                onFinish: () => {
                    setIsSavingSurveyDetails(false);
                },
                onSuccess: () => {
                    setIsEditingSurveyDetails(false);
                },
            },
        );
    };

    const beginQuestionEdit = (question: SurveyQuestion): void => {
        setEditingQuestionId(question.id);
        setQuestionEditState(buildEditState(question));
    };

    const cancelQuestionEdit = (): void => {
        setEditingQuestionId(null);
        setQuestionEditState(null);
    };

    const beginCreateQuestion = (): void => {
        setNewQuestionState(buildEmptyQuestionState());
        setIsCreatingQuestion(true);
    };

    const cancelCreateQuestion = (): void => {
        setNewQuestionState(buildEmptyQuestionState());
        setIsCreatingQuestion(false);
    };

    const saveNewQuestion = (): void => {
        if (!canEditSurvey || isSavingNewQuestion) {
            return;
        }

        const trimmedQuestion = newQuestionState.question.trim();
        if (trimmedQuestion.length === 0) {
            return;
        }

        if (newQuestionState.response_type === 'multiple-choice' && normalizedNewQuestionOptions.length === 0) {
            return;
        }

        router.post(
            surveysRoutes.questions.store(survey.id).url,
            {
                question: trimmedQuestion,
                response_type: newQuestionState.response_type,
                free_text_description: newQuestionState.free_text_description,
                allow_multiple: newQuestionState.allow_multiple,
                branching: newQuestionState.branching,
                options: normalizedNewQuestionOptions.map((option) => ({ option })),
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setIsSavingNewQuestion(true);
                },
                onFinish: () => {
                    setIsSavingNewQuestion(false);
                },
                onSuccess: () => {
                    cancelCreateQuestion();
                },
            },
        );
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

            <div className="relative flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-2xl p-4 md:p-6">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_36%)]" />

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white shadow-[0_28px_70px_-36px_rgba(8,145,178,0.9)]">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(205deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                    <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl" />

                    <CardHeader className="relative z-10 space-y-5 p-6 md:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs tracking-wide text-sky-100 backdrop-blur-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                Survey #{survey.id}
                            </div>

                            <Badge
                                variant={statusVariant(survey.status)}
                                className={`capitalize ${statusPillClass(survey.status)}`}
                            >
                                {survey.status}
                            </Badge>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                        {survey.name}
                                    </h1>
                                    <p className="max-w-3xl text-sm leading-relaxed text-sky-100/90">
                                        {survey.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                                        <p className="text-[11px] tracking-wide text-sky-100/70 uppercase">Start</p>
                                        <p className="mt-1 text-sm font-medium text-white">{formatDate(survey.start_date)}</p>
                                    </div>
                                    <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                                        <p className="text-[11px] tracking-wide text-sky-100/70 uppercase">End</p>
                                        <p className="mt-1 text-sm font-medium text-white">{formatDate(survey.end_date)}</p>
                                    </div>
                                    <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                                        <p className="text-[11px] tracking-wide text-sky-100/70 uppercase">Questions</p>
                                        <p className="mt-1 text-sm font-medium text-white">{survey.questions.length} total</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                <p className="text-xs font-medium tracking-wide text-sky-100/70 uppercase">
                                    Quick Details
                                </p>
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <p className="text-[11px] text-sky-100/70 uppercase">Trigger Word</p>
                                        <p className="mt-1 text-lg font-semibold uppercase tracking-wide text-white">{survey.trigger_word}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-sky-100/70 uppercase">Schedule</p>
                                        <p className="mt-1 text-sm text-sky-50">{formatDateTime(survey.scheduled_time)}</p>
                                    </div>
                                    <div className="rounded-lg border border-white/20 bg-slate-950/25 px-3 py-2 text-xs text-sky-100/90">
                                        {canEditSurvey
                                            ? 'Draft survey: details can be edited.'
                                            : 'Survey is locked for editing.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
                            <Link href={questions.index().url}>
                                <Button
                                    variant="secondary"
                                    className="border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                >
                                    <MoveLeft className="mr-2 h-4 w-4" />
                                    Back to Surveys
                                </Button>
                            </Link>
                            <Link href={surveysRoutes.responses(survey.id).url}>
                                <Button
                                    variant="secondary"
                                    className="border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                >
                                    View Responses
                                </Button>
                            </Link>
                            {(survey.status === 'draft' || survey.status === 'active') ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="border border-amber-200/40 bg-amber-500/80 text-white hover:bg-amber-500"
                                    onClick={cancelSurvey}
                                >
                                    Cancel Survey
                                </Button>
                            ) : null}
                            {survey.status === 'cancelled' ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="border border-emerald-200/40 bg-emerald-500/80 text-white hover:bg-emerald-500"
                                    onClick={reactivateSurvey}
                                >
                                    Reactivate Survey
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="destructive"
                                className="border border-red-300/30 bg-red-500/75 text-white hover:bg-red-500 sm:ml-auto"
                                onClick={deleteSurvey}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Survey
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-start justify-between p-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Start Date</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(survey.start_date)}</p>
                            </div>
                            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-start justify-between p-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500">End Date</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(survey.end_date)}</p>
                            </div>
                            <span className="rounded-lg bg-sky-50 p-2 text-sky-600">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-start justify-between p-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Scheduled Send</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{formatDateTime(survey.scheduled_time)}</p>
                            </div>
                            <span className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                                <Clock3 className="h-4 w-4" />
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-start justify-between p-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Questions</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{survey.questions.length} total</p>
                            </div>
                            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <FileQuestion className="h-4 w-4" />
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-start justify-between p-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Recipients Sent</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{survey.sent_recipients_count}</p>
                            </div>
                            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <Users className="h-4 w-4" />
                            </span>
                        </CardContent>
                    </Card>
                </div>

                <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-blue-50/45 to-cyan-50/40">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg">Survey Details</CardTitle>
                                <p className="mt-1 text-sm text-slate-600">
                                    Update the basic setup from this page while the survey is in draft status.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {isEditingSurveyDetails ? (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelSurveyDetailsEdit}
                                            disabled={isSavingSurveyDetails}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={saveSurveyDetailsEdit}
                                            disabled={isSavingSurveyDetails}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSavingSurveyDetails ? 'Saving...' : 'Save Details'}
                                        </Button>
                                    </>
                                ) : canEditSurvey ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                        onClick={beginSurveyDetailsEdit}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Details
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-600">
                                        Locked for editing
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {isEditingSurveyDetails ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Survey Name</label>
                                        <input
                                            type="text"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.surveyName}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    surveyName: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Trigger Word</label>
                                        <input
                                            type="text"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 uppercase focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.triggerWord}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    triggerWord: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Start Date</label>
                                        <input
                                            type="date"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.startDate}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    startDate: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">End Date</label>
                                        <input
                                            type="date"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.endDate}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    endDate: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Scheduled Send (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        value={surveyDetailsEditState.scheduleTime}
                                        onChange={(event) => {
                                            setSurveyDetailsEditState({
                                                ...surveyDetailsEditState,
                                                scheduleTime: event.target.value,
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        value={surveyDetailsEditState.description}
                                        onChange={(event) => {
                                            setSurveyDetailsEditState({
                                                ...surveyDetailsEditState,
                                                description: event.target.value,
                                            });
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Invitation Message</label>
                                        <textarea
                                            rows={4}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.invitationMessage}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    invitationMessage: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Completion Message</label>
                                        <textarea
                                            rows={4}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={surveyDetailsEditState.completionMessage}
                                            onChange={(event) => {
                                                setSurveyDetailsEditState({
                                                    ...surveyDetailsEditState,
                                                    completionMessage: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Survey Name</p>
                                    <p className="mt-1 text-sm font-medium text-slate-800">{survey.name}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Trigger Word</p>
                                    <p className="mt-1 text-sm font-semibold uppercase text-blue-700">{survey.trigger_word}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Schedule</p>
                                    <p className="mt-1 text-sm text-slate-800">{formatDateTime(survey.scheduled_time)}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Dates</p>
                                    <p className="mt-1 text-sm text-slate-800">
                                        {formatDate(survey.start_date)} - {formatDate(survey.end_date)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 md:col-span-2">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Description</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{survey.description}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Invitation Message</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                        {survey.invitation_message || 'Not set'}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Completion Message</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                        {survey.completion_message || 'Not set'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50/40">
                        <CardTitle className="text-lg text-slate-900">Survey Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {survey.questions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                No questions available for this survey.
                            </div>
                        ) : (
                            sortedQuestions
                                .map((question, index) => {
                                    const isEditingCurrent = editingQuestionId === question.id && questionEditState !== null;

                                    return (
                                        <div
                                            key={question.id}
                                            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                        >
                                            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-500" />
                                            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <p className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                                        Question {index + 1}
                                                    </p>
                                                    {isEditingCurrent ? (
                                                        <input
                                                            type="text"
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                            value={questionEditState.question}
                                                            onChange={(event) => {
                                                                setQuestionEditState({
                                                                    ...questionEditState,
                                                                    question: event.target.value,
                                                                });
                                                            }}
                                                        />
                                                    ) : (
                                                        <h3 className="text-base font-semibold text-slate-900">
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
                                                                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
                                                                className="bg-blue-600 text-white hover:bg-blue-700"
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
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
                                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Response Type
                                                        </label>
                                                        <select
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
                                                            <label className="flex items-center gap-2 text-sm text-slate-600">
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
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
                                                                        className="border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
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
                                                                className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add Option
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            rows={3}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
                                                                    className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-3"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-sm font-medium text-slate-800">
                                                                            {optionIndex + 1}. {option.option}
                                                                        </span>
                                                                        <Badge variant="outline" className="border-slate-300 bg-white text-slate-600">
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
                                                                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                                                                                <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                                                                    Child Questions ({sortedChildQuestions.length})
                                                                                </p>

                                                                                <div className="mt-2 space-y-2">
                                                                                    {sortedChildQuestions.map((childQuestion, childQuestionIndex) => (
                                                                                        <div
                                                                                            key={`${option.id}-child-${childQuestionIndex}`}
                                                                                            className="rounded-lg border border-blue-100 bg-white p-3"
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
                                                                                                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
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

                                                                                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
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
                                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                    {question.free_text_description ||
                                                        'Participant will provide an open-ended text response.'}
                                                </div>
                                            )}

                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                                                <CircleDotDashed className="h-3.5 w-3.5" />
                                                <span>
                                                    Branching: {formatBranching(question.branching)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                        )}

                        {isCreatingQuestion ? (
                            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-500" />
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <p className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                        New Question
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelCreateQuestion}
                                            disabled={isSavingNewQuestion}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={saveNewQuestion}
                                            disabled={!canSaveNewQuestion || isSavingNewQuestion}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSavingNewQuestion ? 'Saving...' : 'Save Question'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Question Text</label>
                                            <input
                                                type="text"
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                placeholder="Enter your question"
                                                value={newQuestionState.question}
                                                onChange={(event) => {
                                                    setNewQuestionState({
                                                        ...newQuestionState,
                                                        question: event.target.value,
                                                    });
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Response Type</label>
                                            <select
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                value={newQuestionState.response_type}
                                                onChange={(event) => {
                                                    const nextType = event.target.value as 'free-text' | 'multiple-choice';
                                                    setNewQuestionState({
                                                        ...newQuestionState,
                                                        response_type: nextType,
                                                        allow_multiple: nextType === 'multiple-choice' ? newQuestionState.allow_multiple : false,
                                                        options: nextType === 'multiple-choice' ? (newQuestionState.options.length > 0 ? newQuestionState.options : ['']) : [''],
                                                    });
                                                }}
                                            >
                                                <option value="free-text">free-text</option>
                                                <option value="multiple-choice">multiple-choice</option>
                                            </select>
                                        </div>
                                    </div>

                                    {newQuestionState.response_type === 'multiple-choice' ? (
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={newQuestionState.allow_multiple}
                                                    onChange={(event) => {
                                                        setNewQuestionState({
                                                            ...newQuestionState,
                                                            allow_multiple: event.target.checked,
                                                        });
                                                    }}
                                                />
                                                Allow participant to pick more than one option
                                            </label>

                                            <div className="space-y-2">
                                                {newQuestionState.options.map((option, optionIndex) => (
                                                    <div key={optionIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                            placeholder={`Option ${optionIndex + 1}`}
                                                            value={option}
                                                            onChange={(event) => {
                                                                const nextOptions = [...newQuestionState.options];
                                                                nextOptions[optionIndex] = event.target.value;
                                                                setNewQuestionState({
                                                                    ...newQuestionState,
                                                                    options: nextOptions,
                                                                });
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setNewQuestionState({
                                                                    ...newQuestionState,
                                                                    options: newQuestionState.options.length > 1
                                                                        ? newQuestionState.options.filter((_, indexToKeep) => indexToKeep !== optionIndex)
                                                                        : [''],
                                                                });
                                                            }}
                                                            className="border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setNewQuestionState({
                                                        ...newQuestionState,
                                                        options: [...newQuestionState.options, ''],
                                                    });
                                                }}
                                                className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Option
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">
                                                Explanation (Optional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                value={newQuestionState.free_text_description}
                                                onChange={(event) => {
                                                    setNewQuestionState({
                                                        ...newQuestionState,
                                                        free_text_description: event.target.value,
                                                    });
                                                }}
                                                placeholder="Participant will provide an open-ended text response."
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">
                                            After answer has been submitted, go to:
                                        </label>
                                        <select
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            value={newQuestionState.branching}
                                            onChange={(event) => {
                                                setNewQuestionState({
                                                    ...newQuestionState,
                                                    branching: event.target.value,
                                                });
                                            }}
                                        >
                                            <option value="0">Next Question, if added</option>
                                            {sortedQuestions.map((question, questionIndex) => (
                                                <option key={question.id} value={questionIndex}>
                                                    Question {questionIndex + 1}
                                                </option>
                                            ))}
                                            <option value="-2" disabled>-- No questions --</option>
                                            <option value="-1">End Survey</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {canEditSurvey && !isCreatingQuestion ? (
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={beginCreateQuestion}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Question
                                </Button>
                            </div>
                        ) : null}
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
