import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    BarChart3,
    CircleCheckBig,
    CircleDotDashed,
    ListChecks,
    PlayCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import surveys from '@/routes/surveys';
import type { BreadcrumbItem } from '@/types';

type SurveyStatus = 'draft' | 'active' | 'completed' | 'scheduled';

interface SurveyStats {
    total: number;
    draft: number;
    active: number;
    completed: number;
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
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const chartColors: Record<SurveyStatus, string> = {
    draft: 'bg-slate-500',
    active: 'bg-emerald-500',
    completed: 'bg-blue-500',
    scheduled: 'bg-amber-500',
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
    const { surveyStats, statusChart, recentSurveys } = usePage().props as unknown as {
        surveyStats: SurveyStats;
        statusChart: ChartPoint[];
        recentSurveys: RecentSurvey[];
    };

    const highestValue = maxChartValue(statusChart);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full w-full  flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="overflow-hidden border-0 bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Survey Performance Dashboard
                        </CardTitle>
                        <p className="text-sm text-slate-300">
                            Monitor survey volume, progress, and recent activity at a glance.
                        </p>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ListChecks className="h-4 w-4" />
                                Total Surveys
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{surveyStats.total}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CircleDotDashed className="h-4 w-4" />
                                Draft Surveys
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{surveyStats.draft}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <PlayCircle className="h-4 w-4" />
                                Active Surveys
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{surveyStats.active}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CircleCheckBig className="h-4 w-4" />
                                Completed Surveys
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{surveyStats.completed}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" />
                                Survey Response Progress
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Visualized using current survey lifecycle states.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {statusChart.map((item) => (
                                <div key={item.key} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{item.label}</span>
                                        <span className="text-muted-foreground">{item.value}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-100">
                                        <div
                                            className={`h-2 rounded-full ${chartColors[item.key]}`}
                                            style={{
                                                width: `${(item.value / highestValue) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Surveys</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentSurveys.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No surveys yet.
                                </p>
                            ) : (
                                recentSurveys.map((survey) => (
                                    <Link
                                        key={survey.id}
                                        href={surveys.show(survey.id).url}
                                        className="block rounded-lg border p-3 transition hover:bg-slate-50"
                                    >
                                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                                            {survey.name}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <Badge variant={badgeVariants[survey.status]} className="capitalize">
                                                {survey.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {survey.contacts_count} recipients
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {survey.created_at
                                                ? format(new Date(survey.created_at), 'MMM d, yyyy')
                                                : 'Date not available'}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
