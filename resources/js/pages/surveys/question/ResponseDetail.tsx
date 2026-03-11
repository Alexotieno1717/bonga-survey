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
        payload: Record<string, unknown> | null;
        created_at: string | null;
    }>;
}

interface PageProps extends InertiaPageProps {
    survey: SurveySummary;
    recipient: RecipientSummary;
    response: ResponseDetail;
}

const statusBadgeMap: Record<RecipientSummary['status'], { label: string; className?: string; variant?: 'outline' | 'default' | 'secondary' }> = {
    pending_send: { label: 'Pending send', variant: 'outline' },
    awaiting_response: { label: 'Awaiting response', className: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'In progress', className: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={surveysRoutes.responses(survey.id).url}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25"
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

                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {recipient.names}
                            </h1>
                            <p className="text-sm text-slate-200">
                                {recipient.phone} • {recipient.email || 'No email'} • {recipient.group_name || 'No group'}
                            </p>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Answers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {response.answers.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No answers recorded yet.
                                </div>
                            ) : (
                                response.answers.map((answer) => (
                                    <div key={answer.id} className="rounded-lg border border-slate-200 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {answer.label}. {answer.question}
                                            </p>
                                            <Badge variant="outline" className="capitalize">
                                                {answer.response_type}
                                            </Badge>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-700">
                                            {answer.answer ?? 'Not answered'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-700">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span>Invited: {formatDateTime(recipient.timeline.invited_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleDot className="h-4 w-4 text-blue-500" />
                                <span>Sent: {formatDateTime(recipient.timeline.sent_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleDot className="h-4 w-4 text-amber-500" />
                                <span>Replied: {formatDateTime(recipient.timeline.replied_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleCheck className="h-4 w-4 text-emerald-500" />
                                <span>Completed: {formatDateTime(recipient.timeline.completed_at)}</span>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                                Response started: {formatDateTime(response.started_at)}
                                <br />
                                Response completed: {formatDateTime(response.completed_at)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Message Log</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {response.messages.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No messages recorded yet.
                            </div>
                        ) : (
                            response.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`rounded-lg border p-3 ${
                                        message.direction === 'inbound'
                                            ? 'border-amber-200 bg-amber-50'
                                            : 'border-blue-200 bg-blue-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-medium uppercase">
                                            {message.direction === 'inbound' ? 'User' : 'System'}
                                        </span>
                                        <span>{formatDateTime(message.created_at)}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span>{message.phone || recipient.phone}</span>
                                        {message.delivery_status ? (
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {message.delivery_status}
                                            </Badge>
                                        ) : null}
                                        {message.provider_message_id ? (
                                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] uppercase text-slate-600">
                                                ID: {message.provider_message_id}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-800">
                                        <span className="whitespace-pre-wrap">
                                            {message.message}
                                        </span>
                                        {message.resolved_option_text ? ` (${message.resolved_option_text})` : ''}
                                    </p>
                                    {message.payload ? (
                                        <details className="mt-2 text-xs text-slate-600">
                                            <summary className="cursor-pointer">Webhook payload</summary>
                                            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-white/70 p-2 text-[11px] text-slate-700">
                                                {JSON.stringify(message.payload, null, 2)}
                                            </pre>
                                        </details>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
