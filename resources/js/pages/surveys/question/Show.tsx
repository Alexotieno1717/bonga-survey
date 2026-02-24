import { Head, Link, usePage } from '@inertiajs/react';
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
} from 'lucide-react';
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
    questions: SurveyQuestion[];
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

export default function Show() {
    const { survey } = usePage().props as unknown as { survey: SurveyDetails };

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
                                .map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="rounded-xl border bg-muted/20 p-4"
                                    >
                                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Question {index + 1}
                                                </p>
                                                <h3 className="text-base font-semibold">
                                                    {question.question}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">
                                                    {question.response_type}
                                                </Badge>
                                                {question.allow_multiple ? (
                                                    <Badge variant="secondary">
                                                        Multi-select
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>

                                        {question.response_type === 'multiple-choice' ? (
                                            <div className="space-y-2">
                                                {question.options.length > 0 ? (
                                                    [...question.options]
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((option, optionIndex) => (
                                                            <div
                                                                key={option.id}
                                                                className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                                                            >
                                                                <span className="text-sm">
                                                                    {optionIndex + 1}. {option.option}
                                                                </span>
                                                                <Badge variant="outline">
                                                                    {formatBranching(option.branching)}
                                                                </Badge>
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
                                ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
