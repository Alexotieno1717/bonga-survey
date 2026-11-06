import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BarChart3,
    CircleCheckBig,
    CircleDotDashed,
    Clock,
    FileText,
    ListChecks,
    PlayCircle,
    Plus,
    Send,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import questions from '@/routes/questions';
import surveys from '@/routes/surveys';
import type { BreadcrumbItem } from '@/types';

type SurveyStatus = 'draft' | 'active' | 'completed' | 'scheduled';

interface SurveyStats {
    total: number;
    draft: number;
    active: number;
    completed: number;
}

interface SurveyCreationStats {
    ai: number;
    manual: number;
}

interface ChartPoint {
    label: string;
    key: SurveyStatus;
    value: number;
}

interface RecentSurvey {
    id: number;
    name: string;
    status: SurveyStatus;
    created_at: string | null;
    contacts_count: number;
    created_with_ai: boolean;
}

interface SmsOutboxEntry {
    sent_at: string;
    phone: string;
    message: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const statusColors: Record<SurveyStatus, { bg: string; text: string; iconBg: string; gradient: string }> = {
    draft: {
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-700 dark:text-zinc-300',
        iconBg: 'bg-zinc-500/10 dark:bg-zinc-400/20',
        gradient: 'from-zinc-500 to-zinc-600',
    },
    active: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/20',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    completed: {
        bg: 'bg-sky-100 dark:bg-sky-900/50',
        text: 'text-sky-700 dark:text-sky-300',
        iconBg: 'bg-sky-500/10 dark:bg-sky-400/20',
        gradient: 'from-sky-500 to-sky-600',
    },
    scheduled: {
        bg: 'bg-amber-100 dark:bg-amber-900/50',
        text: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-500/10 dark:bg-amber-400/20',
        gradient: 'from-amber-500 to-amber-600',
    },
};

const badgeVariants: Record<SurveyStatus, 'outline' | 'default' | 'secondary'> = {
    draft: 'outline',
    active: 'default',
    completed: 'secondary',
    scheduled: 'outline',
};

function maxChartValue(chart: ChartPoint[]): number {
    const values = chart.map((item) => item.value);
    return Math.max(1, ...values);
}

export default function Dashboard() {
    const { surveyStats, surveyCreationStats, statusChart, recentSurveys, smsDriver, smsOutbox } = usePage().props as unknown as {
        surveyStats: SurveyStats;
        surveyCreationStats: SurveyCreationStats;
        statusChart: ChartPoint[];
        recentSurveys: RecentSurvey[];
        smsDriver: string;
        smsOutbox: SmsOutboxEntry[];
    };

    const highestValue = maxChartValue(statusChart);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full w-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
                                <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    Dashboard
                                </h1>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    Welcome back! Here's your survey overview.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={questions.create().url}
                            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.98] dark:bg-purple-500 dark:hover:bg-purple-600"
                        >
                            <Plus className="h-4 w-4" />
                            New Survey
                        </Link>
                    </div>
                </div>

                {/* Stats Grid - Modern Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Surveys */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    Total Surveys
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {surveyStats.total}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>All time</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Active Surveys */}
                    <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-emerald-900/50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    Active
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {surveyStats.active}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <PlayCircle className="h-3 w-3" />
                                    <span>Running now</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                                <PlayCircle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Completed Surveys */}
                    <div className="group relative overflow-hidden rounded-2xl border border-sky-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-sky-900/50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
                                    Completed
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {surveyStats.completed}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                                    <CircleCheckBig className="h-3 w-3" />
                                    <span>Finished</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30">
                                <CircleCheckBig className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Draft Surveys */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    Drafts
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {surveyStats.draft}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    <Clock className="h-3 w-3" />
                                    <span>Pending</span>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-lg shadow-zinc-500/30">
                                <CircleDotDashed className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Chart - Modern Design */}
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 xl:col-span-2">
                        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
                                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                                        Survey Status Breakdown
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Distribution across all surveys
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 p-6">
                            {statusChart.map((item) => (
                                <div key={item.key} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-2 w-2 rounded-full bg-gradient-to-r ${statusColors[item.key].gradient}`} />
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="tabular-nums font-semibold text-zinc-900 dark:text-white">{item.value}</span>
                                            <span className="tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                                                ({Math.round((item.value / surveyStats.total) * 100)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${statusColors[item.key].gradient} transition-all duration-500`}
                                            style={{
                                                width: `${(item.value / highestValue) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Recent Surveys */}
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Recent Surveys
                                    </h3>
                                    <Link
                                        href={questions.index().url}
                                        className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                    >
                                        View all
                                        <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                            <div className="max-h-96 space-y-2 overflow-y-auto p-4">
                                {recentSurveys.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                            <FileText className="h-6 w-6 text-zinc-400" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                            No surveys yet
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                            Create your first survey to get started
                                        </p>
                                        <Link
                                            href={questions.create().url}
                                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Create Survey
                                        </Link>
                                    </div>
                                ) : (
                                    recentSurveys.map((survey) => (
                                        <Link
                                            key={survey.id}
                                            href={surveys.show(survey.id).url}
                                            className="group block rounded-xl border border-zinc-200 p-3 transition-all hover:border-purple-300 hover:bg-purple-50/50 dark:border-zinc-700 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="line-clamp-1 text-sm font-medium text-zinc-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
                                                    {survey.name}
                                                </p>
                                                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-purple-500" />
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Badge variant={badgeVariants[survey.status]} className="capitalize">
                                                    {survey.status}
                                                </Badge>
                                                {survey.created_with_ai && (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        AI
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                <Users className="h-3 w-3" />
                                                <span>{survey.contacts_count} contacts</span>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Creation Method */}
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    Creation Method
                                </h3>
                            </div>
                            <div className="space-y-3 p-4">
                                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-3 dark:from-purple-900/20 dark:to-indigo-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">AI Assisted</span>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums text-purple-700 dark:text-purple-300">
                                        {surveyCreationStats.ai}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                                            <ListChecks className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Manual</span>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                                        {surveyCreationStats.manual}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SMS Outbox — development only */}
                {smsDriver === 'log' ? (
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                                    <Send className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    Local SMS Outbox
                                </h3>
                            </div>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-y-auto p-4">
                            {smsOutbox.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        No logged SMS messages yet.
                                    </p>
                                </div>
                            ) : (
                                smsOutbox.map((entry, index) => (
                                    <div
                                        key={`${entry.sent_at}-${index}`}
                                        className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                            <Clock className="h-3 w-3" />
                                            <span className="tabular-nums">{entry.sent_at || '—'}</span>
                                            <span>→</span>
                                            <span className="font-mono">{entry.phone}</span>
                                        </div>
                                        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {entry.message}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}
