import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    BarChart3,
    CircleDot,
    Clock3,
    Download,
    Filter,
    MessageSquare,
    MoveLeft,
    Search,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import surveysRoutes from '@/routes/surveys';
import { index as surveyResponsesIndex } from '@/routes/surveys/responses';
import type { BreadcrumbItem } from '@/types';

interface SurveySummary {
    id: number;
    name: string;
    status: string;
    created_with_ai?: boolean;
    trigger_word: string;
    start_date: string | null;
    end_date: string | null;
    scheduled_time: string | null;
    questions_count: number;
}

interface ResponseStats {
    total_recipients: number;
    sent_recipients: number;
    pending_recipients: number;
    response_count: number;
    started_recipients: number;
    completed_recipients: number;
    completion_rate: number;
}

interface ResponseFunnel {
    invited: number;
    started: number;
    completed: number;
}

interface QualityMetrics {
    invalid_phone_count: number;
    empty_response_count: number;
    duplicate_phone_count: number;
}

interface TimeSeriesPoint {
    date: string;
    label: string;
    invitations_sent: number;
    responses_received: number;
}

interface QuestionAnalyticsOption {
    id: number;
    option: string | null;
    count: number;
}

interface QuestionAnalytics {
    id: number;
    question: string;
    response_type: 'free-text' | 'multiple-choice';
    total_responses: number;
    free_text_count: number | null;
    options: QuestionAnalyticsOption[];
}

interface RecipientRow {
    id: number;
    names: string;
    phone: string;
    email: string | null;
    group_name: string | null;
    sent_at: string | null;
    response_status: 'awaiting_response' | 'pending_send' | 'in_progress' | 'completed';
    timeline: {
        invited_at: string | null;
        sent_at: string | null;
        delivered_at: string | null;
        replied_at: string | null;
        completed_at: string | null;
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface RecipientsPagination {
    data: RecipientRow[];
    links: PaginationLink[];
    total: number;
    from: number | null;
    to: number | null;
}

interface GroupOption {
    id: number;
    name: string;
}

interface PageProps extends InertiaPageProps {
    survey: SurveySummary;
    stats: ResponseStats;
    funnel: ResponseFunnel;
    quality_metrics: QualityMetrics;
    time_series: TimeSeriesPoint[];
    question_analytics: QuestionAnalytics[];
    groups: GroupOption[];
    filters: {
        search: string;
        status: 'all' | 'sent' | 'pending' | 'awaiting' | 'in_progress' | 'completed';
        date_from: string | null;
        date_to: string | null;
        group_id: number | null;
    };
    recipients: RecipientsPagination;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Not available';
    }

    return format(new Date(value), 'MMM d, yyyy h:mm a');
}

function cleanPaginationLabel(label: string): string {
    return label
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .trim();
}

function toPercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function responseStatusBadge(status: RecipientRow['response_status']): {
    label: string;
    className?: string;
    variant?: 'outline' | 'default' | 'secondary';
} {
    switch (status) {
        case 'completed':
            return { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100' };
        case 'in_progress':
            return { label: 'In progress', className: 'bg-blue-100 text-blue-700 dark:bg-sky-500/20 dark:text-sky-100' };
        case 'awaiting_response':
            return { label: 'Awaiting response', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100' };
        default:
            return { label: 'Pending send', className: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC]', variant: 'outline' };
    }
}

export default function Responses() {
    const {
        survey,
        stats,
        funnel,
        quality_metrics: quality,
        time_series: timeSeries,
        question_analytics: questionAnalytics,
        filters,
        recipients,
        groups,
    } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Survey Responses',
            href: surveyResponsesIndex().url,
        },
        {
            title: survey.name,
            href: surveysRoutes.responses(survey.id).url,
        },
    ];

    const maxSeriesValue = Math.max(...timeSeries.map((point) => point.invitations_sent), 1);

    const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const search = String(formData.get('search') ?? '').trim();
        const status = String(formData.get('status') ?? 'all');
        const dateFrom = String(formData.get('date_from') ?? '').trim();
        const dateTo = String(formData.get('date_to') ?? '').trim();
        const groupId = String(formData.get('group_id') ?? '').trim();

        router.get(
            surveysRoutes.responses(survey.id).url,
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                group_id: groupId || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const exportQuery = {
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        group_id: filters.group_id || undefined,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Responses: ${survey.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 dark:text-[#BAD9FC]">
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-[#010618] via-[#16263a] to-[#2f4157] text-white shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={surveyResponsesIndex().url}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25 dark:hover:bg-white/30"
                                    >
                                        <MoveLeft className="mr-2 h-4 w-4" />
                                        All Response Dashboards
                                    </Button>
                                </Link>
                                <Link href={surveysRoutes.show(survey.id).url}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="bg-white/15 text-white hover:bg-white/25 dark:hover:bg-white/30"
                                    >
                                        Back to Survey
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-white/30 bg-white/15 text-white capitalize">
                                    {survey.status}
                                </Badge>
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
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {survey.name} Responses
                            </h1>
                            <p className="max-w-3xl text-sm text-[#BAD9FC]">
                                Trigger word: <span className="font-semibold uppercase">{survey.trigger_word}</span>.
                                Track delivery, response quality, and completion progress.
                            </p>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                            <Filter className="h-4 w-4" />
                            Export Filters
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Link href={surveysRoutes.responses(survey.id, { query: { ...exportQuery, export: 'csv' } }).url}>
                                <Button type="button" variant="outline" className="dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC] dark:hover:bg-[#010618]/55">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Button>
                            </Link>
                            <Link href={surveysRoutes.responses(survey.id, { query: { ...exportQuery, export: 'xlsx' } }).url}>
                                <Button type="button" variant="outline" className="dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC] dark:hover:bg-[#010618]/55">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                            </Link>
                            <Link href={surveysRoutes.responses(survey.id, { query: { ...exportQuery, export: 'answers_csv' } }).url}>
                                <Button type="button" variant="outline" className="dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC] dark:hover:bg-[#010618]/55">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Answers CSV
                                </Button>
                            </Link>
                            <Link href={surveysRoutes.responses(survey.id, { query: { ...exportQuery, export: 'answers_xlsx' } }).url}>
                                <Button type="button" variant="outline" className="dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC] dark:hover:bg-[#010618]/55">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Answers Excel
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search name, phone, email"
                                className="xl:col-span-2 dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                            />
                            <select
                                name="status"
                                defaultValue={filters.status}
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                            >
                                <option value="all">All status</option>
                                <option value="sent">Sent only</option>
                                <option value="pending">Pending only</option>
                                <option value="awaiting">Awaiting response</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
                                name="group_id"
                                defaultValue={filters.group_id ?? ''}
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                            >
                                <option value="">All groups</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" className="xl:col-span-1 dark:bg-sky-400 dark:text-[#010618] dark:hover:bg-sky-300">
                                <Search className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>

                            <Input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                            />
                            <Input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                            />
                        </form>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground dark:text-[#BAD9FC]">
                                <Users className="h-4 w-4" />
                                Total Recipients
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold dark:text-white">{stats.total_recipients}</p>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground dark:text-[#BAD9FC]">
                                <MessageSquare className="h-4 w-4" />
                                Invitations Sent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold dark:text-white">{stats.sent_recipients}</p>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground dark:text-[#BAD9FC]">
                                <Clock3 className="h-4 w-4" />
                                Pending Delivery
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold dark:text-white">{stats.pending_recipients}</p>
                        </CardContent>
                    </Card>

                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground dark:text-[#BAD9FC]">
                                <BarChart3 className="h-4 w-4" />
                                Responses Started
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold dark:text-white">{stats.response_count}</p>
                            <p className="text-xs text-muted-foreground dark:text-[#BAD9FC]">
                                Completed: {stats.completed_recipients} • Rate: {stats.completion_rate}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base dark:text-white">Completion Funnel</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[{ label: 'Invited', value: funnel.invited }, { label: 'Started', value: funnel.started }, { label: 'Completed', value: funnel.completed }].map((step) => (
                                <div key={step.label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span>{step.label}</span>
                                        <span className="font-medium">{step.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#010618]/55">
                                        <div
                                            className="h-2 rounded-full bg-blue-600 dark:bg-sky-400"
                                            style={{ width: `${toPercent(step.value, funnel.invited)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base dark:text-white">Response Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">Invalid Phones</p>
                                <p className="text-xl font-semibold dark:text-white">{quality.invalid_phone_count}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">Empty Responses</p>
                                <p className="text-xl font-semibold dark:text-white">{quality.empty_response_count}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">Duplicate Phones</p>
                                <p className="text-xl font-semibold dark:text-white">{quality.duplicate_phone_count}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader>
                        <CardTitle className="text-base dark:text-white">Time-Series Trend (7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-3">
                            {timeSeries.map((point) => (
                                <div key={point.date} className="flex flex-col items-center gap-2">
                                    <div className="flex h-28 w-full items-end rounded-md bg-slate-50 px-2 pb-2 dark:bg-[#010618]/45">
                                        <div
                                            className="w-full rounded-sm bg-blue-600 dark:bg-sky-400"
                                            style={{ height: `${Math.max(8, Math.round((point.invitations_sent / maxSeriesValue) * 100))}%` }}
                                            title={`Invitations: ${point.invitations_sent}, Responses: ${point.responses_received}`}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-[#BAD9FC]">{point.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader>
                        <CardTitle className="text-base dark:text-white">Per-Question Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {questionAnalytics.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No questions found for this survey.
                            </div>
                        ) : (
                            questionAnalytics.map((question, index) => (
                                <div key={question.id} className="rounded-xl border border-slate-200 p-4 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-medium text-slate-900 dark:text-white">Q{index + 1}. {question.question}</p>
                                        <Badge variant="outline" className="capitalize dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">{question.response_type}</Badge>
                                    </div>

                                    {question.response_type === 'multiple-choice' ? (
                                        <div className="space-y-2">
                                            {question.options.map((option) => (
                                                <div key={option.id}>
                                                    <div className="mb-1 flex items-center justify-between text-sm">
                                                        <span>{option.option || 'Option'}</span>
                                                        <span>{option.count}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#010618]/55">
                                                        <div className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-300" style={{ width: `${toPercent(option.count, question.total_responses)}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 dark:text-[#BAD9FC]">
                                            Free-text responses: <span className="font-medium">{question.free_text_count ?? 0}</span>
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader>
                        <CardTitle className="text-base dark:text-white">Recipient Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#4f6885]">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-[#010618]/45">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-[#BAD9FC]">Recipient</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-[#BAD9FC]">Group</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-[#BAD9FC]">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-[#BAD9FC]">Timeline</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recipients.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            No recipients found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    recipients.data.map((recipient) => (
                                        <tr key={recipient.id} className="border-t border-slate-100 align-top dark:border-[#405775]">
                                            <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100">
                                                <p className="font-medium">{recipient.names}</p>
                                                <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">{recipient.phone} • {recipient.email || '-'}</p>
                                                <Link
                                                    href={`${surveysRoutes.responses(survey.id).url}/${recipient.id}`}
                                                    className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:underline dark:text-sky-300"
                                                >
                                                    View responses
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-[#BAD9FC]">{recipient.group_name || '-'}</td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const badge = responseStatusBadge(recipient.response_status);

                                                    return (
                                                        <Badge variant={badge.variant} className={badge.className}>
                                                            {badge.label}
                                                        </Badge>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-[#BAD9FC]">
                                                <div className="space-y-1">
                                                    <p><strong>Invited:</strong> {formatDateTime(recipient.timeline.invited_at)}</p>
                                                    <p><strong>Sent:</strong> {formatDateTime(recipient.timeline.sent_at)}</p>
                                                    <p><strong>Delivered:</strong> {formatDateTime(recipient.timeline.delivered_at)}</p>
                                                    <p><strong>Replied:</strong> {formatDateTime(recipient.timeline.replied_at)}</p>
                                                    <p><strong>Completed:</strong> {formatDateTime(recipient.timeline.completed_at)}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-slate-600 dark:text-[#BAD9FC]">
                                Showing {recipients.from ?? 0} to {recipients.to ?? 0} of {recipients.total} recipients
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                {recipients.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`rounded-md border px-3 py-1.5 text-sm transition ${
                                                link.active
                                                    ? 'border-blue-600 bg-blue-600 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-[#010618]'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-[#4f6885] dark:bg-[#2f4157]/70 dark:text-[#BAD9FC] dark:hover:bg-[#3a4f68]/80'
                                            }`}
                                        >
                                            {cleanPaginationLabel(link.label)}
                                        </Link>
                                    ) : (
                                        <span
                                            key={index}
                                            className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-400 dark:border-[#405775] dark:bg-[#2f4157]/45 dark:text-[#9fbbd8]"
                                        >
                                            {cleanPaginationLabel(link.label)}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-dashed dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base dark:text-white">
                            <CircleDot className="h-4 w-4" />
                            Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2 dark:text-[#BAD9FC]">
                        <p>Reply/completion statuses are derived from SMS flow start/completion timestamps.</p>
                        <p>Per-question analytics remain placeholders until answer storage is implemented.</p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
