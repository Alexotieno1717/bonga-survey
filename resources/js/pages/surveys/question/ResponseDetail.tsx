import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CircleCheck, CircleDot, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import surveysRoutes from '@/routes/surveys';
import { index as surveyResponsesIndex } from '@/routes/surveys/responses';
import type { BreadcrumbItem } from '@/types';

interface SurveySummary {
    id: number;
    name: string;
    created_with_ai?: boolean;
}

interface RecipientSummary {
    id: number;
    names: string;
    phone: string;
    email: string | null;
    group_name: string | null;
    status: 'pending_send' | 'awaiting_response' | 'in_progress' | 'completed';
    timeline: {
        invited_at: string | null;
        sent_at: string | null;
        replied_at: string | null;
        completed_at: string | null;
    };
}

interface ResponseAnswer {
    id: number;
    label: string;
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    answer: string | null;
}

interface ResponseDetail {
    started_at: string | null;
    completed_at: string | null;
    answers: ResponseAnswer[];
    messages: Array<{
        id: number;
        direction: 'inbound' | 'outbound';
        phone: string | null;
        delivery_status: string | null;
        provider_message_id: string | null;
        resolved_option_text: string | null;
        message: string;
        created_at: string | null;
    }>;
}

interface PageProps extends InertiaPageProps {
    survey: SurveySummary;
    recipient: RecipientSummary;
    response: ResponseDetail;
}

const statusBadgeMap: Record<RecipientSummary['status'], { label: string; className?: string; variant?: 'outline' | 'default' | 'secondary' }> = {
    pending_send: { label: 'Pending send', variant: 'outline', className: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC]' },
    awaiting_response: { label: 'Awaiting response', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100' },
    in_progress: { label: 'In progress', className: 'bg-blue-100 text-blue-700 dark:bg-sky-500/20 dark:text-sky-100' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100' },
};

function formatDateTime(value: string | null): string {
    if (! value) {
        return 'Not available';
    }

    return format(new Date(value), 'MMM d, yyyy h:mm a');
}

export default function ResponseDetail() {
    const { survey, recipient, response } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Survey Responses',
            href: surveyResponsesIndex().url,
        },
        {
            title: survey.name,
            href: surveysRoutes.responses(survey.id).url,
        },
        {
            title: recipient.names,
            href: `${surveysRoutes.responses(survey.id).url}/${recipient.id}`,
        },
    ];

    const badge = statusBadgeMap[recipient.status];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Response: ${recipient.names}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 dark:text-[#BAD9FC]">
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-[#010618] via-[#16263a] to-[#2f4157] text-white shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={surveysRoutes.responses(survey.id).url}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25 dark:hover:bg-white/30"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Responses
                                    </Button>
                                </Link>
                            </div>
                            <Badge className={badge.className} variant={badge.variant}>
                                {badge.label}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                            <span className="uppercase tracking-wide text-slate-300">Survey</span>
                            <Link
                                href={surveysRoutes.show(survey.id).url}
                                className="font-semibold text-white hover:text-slate-100"
                            >
                                {survey.name}
                            </Link>
                            <Badge
                                variant="outline"
                                    className={
                                    survey.created_with_ai
                                        ? 'border-cyan-200/60 bg-cyan-200/10 text-cyan-100'
                                        : 'border-white/30 bg-white/10 text-[#BAD9FC]'
                                }
                            >
                                {survey.created_with_ai ? 'AI' : 'Manual'}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {recipient.names}
                            </h1>
                            <p className="text-sm text-[#BAD9FC]">
                                {recipient.phone} • {recipient.email || 'No email'} • {recipient.group_name || 'No group'}
                            </p>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2 dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base dark:text-white">Answers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {response.answers.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No answers recorded yet.
                                </div>
                            ) : (
                                response.answers.map((answer) => (
                                    <div key={answer.id} className="rounded-lg border border-slate-200 p-4 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {answer.label}. {answer.question}
                                            </p>
                                            <Badge variant="outline" className="capitalize dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">
                                                {answer.response_type}
                                            </Badge>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-700 dark:text-[#BAD9FC]">
                                            {answer.answer ?? 'Not answered'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base dark:text-white">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-700 dark:text-[#BAD9FC]">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500 dark:text-[#BAD9FC]" />
                                <span>Invited: {formatDateTime(recipient.timeline.invited_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleDot className="h-4 w-4 text-blue-500 dark:text-sky-300" />
                                <span>Sent: {formatDateTime(recipient.timeline.sent_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleDot className="h-4 w-4 text-amber-500 dark:text-amber-300" />
                                <span>Replied: {formatDateTime(recipient.timeline.replied_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                                <span>Completed: {formatDateTime(recipient.timeline.completed_at)}</span>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500 dark:border-[#4f6885] dark:bg-[#010618]/35 dark:text-[#BAD9FC]">
                                Response started: {formatDateTime(response.started_at)}
                                <br />
                                Response completed: {formatDateTime(response.completed_at)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/80 dark:border-[#4f6885] dark:bg-[#010618]/45">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base dark:text-white">Message Log</CardTitle>
                            <Badge variant="outline" className="text-xs text-slate-600 dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">
                                {response.messages.length} messages
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {response.messages.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No messages recorded yet.
                            </div>
                        ) : (
                            response.messages.map((message) => {
                                const isInbound = message.direction === 'inbound';

                                return (
                                    <div
                                        key={message.id}
                                        className={`rounded-xl border p-4 shadow-sm ${
                                            isInbound
                                                ? 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:border-amber-400/35 dark:from-amber-500/15 dark:via-slate-900/70 dark:to-amber-500/10'
                                                : 'border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 dark:border-sky-400/35 dark:from-sky-500/15 dark:via-slate-900/70 dark:to-sky-500/10'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-[#BAD9FC]">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        isInbound ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`}
                                                />
                                                <span>{isInbound ? 'User' : 'System'}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-[#BAD9FC]">
                                                {formatDateTime(message.created_at)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#BAD9FC]">
                                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-[#010618]/55 dark:text-[#BAD9FC]">
                                                {message.phone || recipient.phone}
                                            </span>
                                            {message.delivery_status ? (
                                                <Badge variant="outline" className="text-[10px] uppercase dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">
                                                    {message.delivery_status}
                                                </Badge>
                                            ) : null}
                                            {message.provider_message_id ? (
                                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] uppercase text-slate-600 dark:bg-[#010618]/55 dark:text-[#BAD9FC]">
                                                    ID: {message.provider_message_id}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-3 rounded-lg border border-white/60 bg-white/80 p-3 text-sm text-slate-800 shadow-inner dark:border-[#4f6885] dark:bg-[#010618]/55 dark:text-white">
                                            <span className="whitespace-pre-wrap">{message.message}</span>
                                            {message.resolved_option_text ? (
                                                <div className="mt-2 text-xs text-slate-500 dark:text-[#BAD9FC]">
                                                    Resolved option: {message.resolved_option_text}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
