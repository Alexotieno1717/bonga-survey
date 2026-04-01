import type { ColumnDef } from '@tanstack/react-table';
import { Download, EditIcon, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import type { FormValues } from '@/components/survey/create/types';
import SurveyDataTableCard from '@/components/survey/SurveyDataTableCard';
import SurveyHeaderActionsCard from '@/components/survey/SurveyHeaderActionsCard';
import SurveySearchField from '@/components/survey/SurveySearchField';
import SurveySectionCard from '@/components/survey/SurveySectionCard';
import SurveyToolbarActionButton from '@/components/survey/SurveyToolbarActionButton';

interface ReviewAndSendRow {
    id: number;
    message: string;
    number: string;
    msgCount: number;
    name: string;
}

interface ReviewAndSendStepProps {
    values: FormValues;
}

export default function ReviewAndSendStep({
    values,
}: ReviewAndSendStepProps) {
    const sendRows: ReviewAndSendRow[] = values.recipients.map((recipient) => ({
        id: recipient.id,
        message: values.invitationMessage || 'Reply with START to participate STOP*000*2*1#',
        number: recipient.phone,
        msgCount: 1,
        name: recipient.names,
    }));

    const reviewSendColumns: ColumnDef<ReviewAndSendRow>[] = [
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-sky-100">{row.original.message}</span>
            ),
        },
        {
            accessorKey: 'number',
            header: 'Number',
            cell: ({ row }) => (
                <span className="text-blue-600 dark:text-sky-100">{row.original.number}</span>
            ),
        },
        {
            accessorKey: 'msgCount',
            header: 'Msg Count',
            cell: ({ row }) => (
                <span className="text-blue-600 dark:text-sky-100">{row.original.msgCount}</span>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: () => (
                <div className="flex items-center space-x-2">
                    <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-500/35 dark:text-slate-200 dark:hover:bg-slate-800/70">
                        <EditIcon className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-500/35 dark:text-slate-200 dark:hover:bg-slate-800/70">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];

    return (
        <div className="space-y-6">
            <SurveyHeaderActionsCard
                title="Review and Send"
                description="Kindly review the invitation message."
                actions={(
                    <>
                        <SurveySearchField
                            name="search"
                            placeholder="Search for Messages"
                        />
                        <SurveyToolbarActionButton
                            icon={<Trash2 className="h-4 w-4" />}
                            label="Delete"
                            variant="neutral"
                        />
                        <SurveyToolbarActionButton
                            icon={<Download className="h-4 w-4" />}
                            label="Download CSV"
                            variant="primary"
                        />
                    </>
                )}
            />

            <SurveySectionCard className="p-5 md:p-6">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-300">Message Preview</p>
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-500/35 dark:bg-slate-800/70 dark:text-slate-100">
                    {values.invitationMessage || 'Reply with START to participate'}
                </p>
            </SurveySectionCard>

            <SurveyDataTableCard>
                <DataTable<ReviewAndSendRow>
                    columns={reviewSendColumns}
                    data={sendRows}
                    filterColumn="message"
                    pageSize={10}
                />
            </SurveyDataTableCard>

            <div className="flex justify-end">
                <SurveyToolbarActionButton
                    icon={<Trash2 className="h-4 w-4" />}
                    label="Discard"
                    variant="danger"
                />
            </div>
        </div>
    );
}
