import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { BarChart3, MessageSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import surveysRoutes from '@/routes/surveys';
import { index as surveyResponsesIndex } from '@/routes/surveys/responses';
import type { BreadcrumbItem } from '@/types';

interface SurveyListItem {
    id: number;
    name: string;
    status: string;
    created_at: string;
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

function cleanPaginationLabel(label: string): string {
    return label
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .trim();
}

export default function ResponsesIndex() {
    const { surveys } = usePage().props as unknown as { surveys: SurveysPagination };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Survey Responses',
            href: surveyResponsesIndex().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Survey Responses" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-2xl font-semibold">Survey Responses</CardTitle>
                        <p className="text-sm text-slate-200">
                            Select a survey to view response analytics, delivery, and recipient timelines.
                        </p>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {surveys.data.map((survey) => (
                        <Link
                            key={survey.id}
                            href={surveysRoutes.responses(survey.id).url}
                            className="block"
                        >
                            <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                                <CardHeader className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="line-clamp-1 text-base">{survey.name}</CardTitle>
                                        <Badge variant="outline" className="capitalize">
                                            {survey.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <span>{survey.questions_count} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{survey.contacts_count} recipients</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{survey.sent_recipients_count} invitations sent</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-600">
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
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {cleanPaginationLabel(link.label)}
                                </Link>
                            ) : (
                                <span
                                    key={index}
                                    className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-400"
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
