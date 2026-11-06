import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowRight,
    BarChart3,
    Bot,
    CalendarDays,
    MessageSquare,
    Users,
} from 'lucide-react';
import NotFound from '@/components/NotFound';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import questions from '@/routes/questions';
import surveysRoutes from '@/routes/surveys';
import { index as surveyResponsesIndex } from '@/routes/surveys/responses';
import type { BreadcrumbItem } from '@/types';

interface SurveyListItem {
    id: number;
    name: string;
    status: string;
    created_at: string;
    created_with_ai?: boolean;
    questions_count: number;
    contacts_count: number;
    sent_recipients_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface SurveysPagination {
    data: SurveyListItem[];
    links: PaginationLink[];
    total: number;
    from: number | null;
    to: number | null;
}

interface PageProps extends InertiaPageProps {
    surveys: SurveysPagination;
}

function cleanPaginationLabel(label: string): string {
    return label
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .trim();
}

function formatStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeClassName(status: string): string {
    switch (status) {
        case 'active':
            return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100';
        case 'scheduled':
            return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-100';
        case 'completed':
            return 'border-blue-200 bg-blue-100 text-blue-700 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-100';
        case 'cancelled':
            return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/20 dark:text-rose-100';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/40 dark:bg-slate-500/25 dark:text-slate-100';
    }
}

function getDeliveryCoverage(sentRecipientsCount: number, contactsCount: number): number {
    if (contactsCount === 0) {
        return 0;
    }

    return Math.round((sentRecipientsCount / contactsCount) * 100);
}

export default function ResponsesIndex() {
    const { surveys } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Survey Responses',
            href: surveyResponsesIndex().url,
        },
    ];

    const activeSurveysCount = surveys.data.filter((survey) => survey.status === 'active').length;
    const aiSurveysCount = surveys.data.filter((survey) => survey.created_with_ai).length;
    const visibleRecipientsCount = surveys.data.reduce((sum, survey) => sum + survey.contacts_count, 0);
    const visibleInvitationsCount = surveys.data.reduce((sum, survey) => sum + survey.sent_recipients_count, 0);

    const overviewMetrics = [
        {
            label: 'Total surveys',
            value: surveys.total,
            hint: 'Across the response workspace',
            icon: BarChart3,
        },
        {
            label: 'Active on this page',
            value: activeSurveysCount,
            hint: 'Ready for monitoring right now',
            icon: MessageSquare,
        },
        {
            label: 'Recipients in view',
            value: visibleRecipientsCount,
            hint: 'Contacts attached to the visible surveys',
            icon: Users,
        },
        {
            label: 'AI-assisted',
            value: aiSurveysCount,
            hint: 'Surveys drafted with AI on this page',
            icon: Bot,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Survey Responses" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 dark:text-[#BAD9FC]">
                <Card className="relative overflow-hidden border-0 bg-[#071426] text-white shadow-2xl shadow-[#010618]/25">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.24),_transparent_32%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_26%)]" />
                    <CardHeader className="relative z-10 gap-6 border-b border-white/10 pb-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <div className="inline-flex items-center rounded-full border border-sky-300/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-[0.24em] text-sky-100 uppercase">
                                    Response hub
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
                                        Survey Responses
                                    </CardTitle>
                                    <p className="max-w-xl text-sm leading-6 text-[#BAD9FC]">
                                        Browse surveys as a response directory instead of isolated cards. Status, delivery coverage, and audience size are visible before you drill into the detail page.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#010618]/40 px-4 py-3 text-sm text-[#BAD9FC] backdrop-blur">
                                <p className="text-xs font-medium tracking-[0.2em] text-sky-100 uppercase">
                                    Current page
                                </p>
                                <p className="mt-2 text-base font-semibold text-white">
                                    Showing {surveys.from ?? 0} to {surveys.to ?? 0} of {surveys.total} surveys
                                </p>
                                <p className="mt-1 text-xs text-[#9fbbd8]">
                                    {visibleInvitationsCount} invitations already dispatched in this view.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative z-10 grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                        {overviewMetrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium tracking-[0.16em] text-[#9fbbd8] uppercase">
                                            {metric.label}
                                        </p>
                                        <p className="mt-3 text-3xl font-semibold text-white">
                                            {metric.value}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-sky-100">
                                        <metric.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-xs leading-5 text-[#9fbbd8]">
                                    {metric.hint}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {surveys.data.length === 0 ? (
                    <Card className="border-slate-200 bg-white/90 py-12 shadow-sm dark:border-[#405775] dark:bg-[#071426]/90">
                        <CardContent>
                            <NotFound
                                title="Survey responses"
                                pathToCreate={questions.create().url}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm dark:border-[#405775] dark:bg-[#071426]/92">
                        <CardHeader className="gap-4 border-b border-slate-200 bg-slate-50/80 pb-5 dark:border-[#405775] dark:bg-[#0c1b2e]/85">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium tracking-[0.22em] text-slate-500 uppercase dark:text-[#9fbbd8]">
                                        Survey directory
                                    </p>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        Response activity by survey
                                    </CardTitle>
                                    <p className="text-sm text-slate-600 dark:text-[#BAD9FC]">
                                        Scan audience size, delivery progress, and survey origin before opening the analytics dashboard.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-[#4f6885] dark:bg-[#10233a] dark:text-[#BAD9FC]">
                                    <CalendarDays className="h-4 w-4 text-slate-500 dark:text-sky-100" />
                                    Ordered by newest first
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 px-4 py-5 md:px-6">
                            <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] gap-4 px-4 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase lg:grid dark:text-[#9fbbd8]">
                                <span>Survey</span>
                                <span>Scope</span>
                                <span>Delivery</span>
                                <span className="text-right">Open</span>
                            </div>

                            {surveys.data.map((survey) => {
                                const deliveryCoverage = getDeliveryCoverage(
                                    survey.sent_recipients_count,
                                    survey.contacts_count,
                                );

                                return (
                                    <Link
                                        key={survey.id}
                                        href={surveysRoutes.responses(survey.id).url}
                                        className="group block overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-50/90 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-[#405775] dark:bg-gradient-to-r dark:from-[#0d1b2d] dark:via-[#0d1f33] dark:to-[#12263b] dark:hover:border-[#6d87a8]"
                                    >
                                        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.15fr)_minmax(0,1.35fr)_auto] lg:items-center">
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'capitalize',
                                                            statusBadgeClassName(survey.status),
                                                        )}
                                                    >
                                                        {formatStatusLabel(survey.status)}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            survey.created_with_ai
                                                                ? 'border-sky-300/45 bg-sky-500/10 text-sky-700 dark:border-sky-300/45 dark:bg-sky-500/15 dark:text-sky-100'
                                                                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#6d87a8] dark:bg-[#010618]/35 dark:text-[#BAD9FC]',
                                                        )}
                                                    >
                                                        {survey.created_with_ai ? 'AI assisted' : 'Manual build'}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-slate-700 dark:text-white dark:group-hover:text-sky-100">
                                                        {survey.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-[#BAD9FC]">
                                                        <span className="inline-flex items-center gap-2">
                                                            <CalendarDays className="h-4 w-4 text-slate-400 dark:text-sky-100" />
                                                            Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-slate-400 dark:text-sky-100" />
                                                            {survey.sent_recipients_count} invitation{survey.sent_recipients_count === 1 ? '' : 's'} sent
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <p className="text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase dark:text-[#9fbbd8]">
                                                        Questions
                                                    </p>
                                                    <div className="flex items-end gap-2">
                                                        <BarChart3 className="h-4 w-4 text-slate-400 dark:text-sky-100" />
                                                        <span className="text-3xl font-semibold text-slate-900 dark:text-white">
                                                            {survey.questions_count}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-[#9fbbd8]">
                                                        Structured survey prompts
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <p className="text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase dark:text-[#9fbbd8]">
                                                        Recipients
                                                    </p>
                                                    <div className="flex items-end gap-2">
                                                        <Users className="h-4 w-4 text-slate-400 dark:text-sky-100" />
                                                        <span className="text-3xl font-semibold text-slate-900 dark:text-white">
                                                            {survey.contacts_count}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-[#9fbbd8]">
                                                        Audience linked to this survey
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 px-4 py-2">
                                                <div className="flex items-end justify-between gap-3">
                                                    <div>
                                                        <p className="text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase dark:text-[#9fbbd8]">
                                                            Delivery coverage
                                                        </p>
                                                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                                            {deliveryCoverage}%
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-sm text-slate-600 dark:text-[#BAD9FC]">
                                                        <p>{survey.sent_recipients_count} sent</p>
                                                        <p>{survey.contacts_count} total</p>
                                                    </div>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#16263a]">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all"
                                                        style={{ width: `${deliveryCoverage}%` }}
                                                    />
                                                </div>

                                                <p className="text-xs leading-5 text-slate-500 dark:text-[#9fbbd8]">
                                                    {survey.contacts_count === 0
                                                        ? 'No recipients are attached yet.'
                                                        : `${survey.sent_recipients_count} of ${survey.contacts_count} recipients have received an invitation.`}
                                                </p>
                                            </div>

                                            <div className="flex justify-end lg:justify-center">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-sky-600 dark:bg-sky-400 dark:text-[#071426] dark:group-hover:bg-sky-300">
                                                    <span>Open responses</span>
                                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                <div className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between dark:border-[#4f6885]">
                    <p className="text-sm text-slate-600 dark:text-[#BAD9FC]">
                        Showing {surveys.from ?? 0} to {surveys.to ?? 0} of {surveys.total} surveys
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {surveys.links.map((link, index) =>
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
            </div>
        </AppLayout>
    );
}
