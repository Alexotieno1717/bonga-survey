import type { ColumnDef } from '@tanstack/react-table';
import { EditIcon, Trash2, UserPlus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import AddContactsModal from '@/components/AddContactsModal';
import { DataTable } from '@/components/DataTable';
import type { Contact, FormValues, SetFieldValue } from '@/components/survey/create/types';
import SurveyDataTableCard from '@/components/survey/SurveyDataTableCard';
import SurveyHeaderActionsCard from '@/components/survey/SurveyHeaderActionsCard';
import SurveySearchField from '@/components/survey/SurveySearchField';
import SurveyToolbarActionButton from '@/components/survey/SurveyToolbarActionButton';

interface ReviewRecipientsStepProps {
    values: FormValues;
    setFieldValue: SetFieldValue;
}

export default function ReviewRecipientsStep({
    values,
    setFieldValue,
}: ReviewRecipientsStepProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const reviewRecipientColumns: ColumnDef<Contact>[] = [
        {
            accessorKey: 'phone',
            header: 'Number',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-sky-100">{row.original.phone}</span>
            ),
        },
        {
            accessorKey: 'names',
            header: 'Name',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center space-x-2">
                    <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-500/35 dark:text-slate-200 dark:hover:bg-slate-800/70">
                        <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-500/35 dark:text-slate-200 dark:hover:bg-slate-800/70"
                        onClick={() => {
                            setFieldValue(
                                'recipients',
                                values.recipients.filter((recipient: Contact) => recipient.id !== row.original.id),
                            );
                        }}
                    >
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
                title="Review Recipients"
                description="Kindly review the recipients and rectify the ones that need fixing."
                actions={(
                    <>
                        <SurveySearchField
                            name="search"
                            placeholder="Search for recipient"
                        />

                        <SurveyToolbarActionButton
                            icon={<Trash2 className="h-4 w-4" />}
                            label="Delete"
                            variant="neutral"
                        />

                        <SurveyToolbarActionButton
                            icon={<UserPlus className="h-4 w-4" />}
                            label="Add New Recipient"
                            variant="primary"
                            onClick={() => setIsModalOpen(true)}
                        />

                        <AddContactsModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onAddRecipient={(newRecipient) => {
                                const newContact: Contact = {
                                    id: Date.now(),
                                    names: newRecipient.name,
                                    phone: newRecipient.phone,
                                    email: newRecipient.email || '',
                                };

                                setFieldValue('recipients', [...values.recipients, newContact]);
                                setIsModalOpen(false);

                                toast.success('Recipient added successfully!');
                            }}
                        />
                    </>
                )}
            />

            <SurveyDataTableCard>
                <DataTable<Contact>
                    columns={reviewRecipientColumns}
                    data={values.recipients}
                    filterColumn="names"
                    pageSize={10}
                />
            </SurveyDataTableCard>

            {values.recipients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm text-slate-500 dark:border-slate-500/35 dark:bg-slate-800/70 dark:text-slate-200">
                    No recipients selected. Please go back and select recipients.
                </div>
            ) : null}
        </div>
    );
}
