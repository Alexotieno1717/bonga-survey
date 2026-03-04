import { Field } from 'formik';
import type { Contact, FormValues, SetFieldValue } from '@/components/survey/create/types';
import { Button } from '@/components/ui/button';

interface AddRecipientsStepProps {
    values: FormValues;
    contacts: Contact[];
    recipientInputMode: 'contacts' | 'upload';
    setRecipientInputMode: React.Dispatch<React.SetStateAction<'contacts' | 'upload'>>;
    isParsingRecipientsFile: boolean;
    uploadedRecipientFileName: string;
    setFieldValue: SetFieldValue;
    onRecipientFileUpload: (
        event: React.ChangeEvent<HTMLInputElement>,
        setFieldValue: SetFieldValue,
    ) => Promise<void>;
}

export default function AddRecipientsStep({
    values,
    contacts,
    recipientInputMode,
    setRecipientInputMode,
    isParsingRecipientsFile,
    uploadedRecipientFileName,
    setFieldValue,
    onRecipientFileUpload,
}: AddRecipientsStepProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <h1 className="text-lg font-semibold text-slate-900">Add Survey Participants</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Choose how you want to add recipients and select who should receive this survey.
                </p>

                <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setRecipientInputMode('contacts')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            recipientInputMode === 'contacts'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Select contacts
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecipientInputMode('upload')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            recipientInputMode === 'upload'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Upload file
                    </button>
                </div>
            </div>

            {recipientInputMode === 'contacts' && (
                <>
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                            Select Survey Participants from your contacts list
                        </label>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label
                                className={`cursor-pointer rounded-lg border p-3 transition ${
                                    values.recipientSelectionType === 'all'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Field
                                        type="radio"
                                        name="recipientSelectionType"
                                        value="all"
                                        className="form-radio"
                                        onChange={() => {
                                            setFieldValue('recipientSelectionType', 'all');
                                            setFieldValue('recipients', contacts);
                                            setFieldValue('selectedContactIds', contacts.map((contact) => Number(contact.id)));
                                        }}
                                    />
                                    <span className="text-sm font-medium text-slate-800">
                                        All contacts ({contacts.length || 0})
                                    </span>
                                </div>
                            </label>

                            <label
                                className={`cursor-pointer rounded-lg border p-3 transition ${
                                    values.recipientSelectionType === 'select'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Field
                                        type="radio"
                                        name="recipientSelectionType"
                                        value="select"
                                        className="form-radio"
                                        onChange={() => {
                                            setFieldValue('recipientSelectionType', 'select');
                                            setFieldValue('recipients', []);
                                            setFieldValue('selectedContactIds', []);
                                        }}
                                    />
                                    <span className="text-sm font-medium text-slate-800">
                                        Select survey participants
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {values.recipientSelectionType === 'select' && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Select Contacts</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                    Selected: {values.recipients.length}
                                </span>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                            <input
                                                type="checkbox"
                                                onChange={(event) => {
                                                    if (event.target.checked) {
                                                        setFieldValue('recipients', contacts);
                                                        setFieldValue('selectedContactIds', contacts.map((contact) => Number(contact.id)));
                                                    } else {
                                                        setFieldValue('recipients', []);
                                                        setFieldValue('selectedContactIds', []);
                                                    }
                                                }}
                                                checked={values.recipients.length === contacts.length && contacts.length > 0}
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {contacts.map((contact) => (
                                        <tr key={contact.id} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={values.recipients.some((recipient) => recipient.id === contact.id)}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setFieldValue('recipients', [...values.recipients, contact]);
                                                            setFieldValue('selectedContactIds', [
                                                                ...values.selectedContactIds,
                                                                Number(contact.id),
                                                            ]);
                                                        } else {
                                                            setFieldValue(
                                                                'recipients',
                                                                values.recipients.filter((recipient) => recipient.id !== contact.id),
                                                            );
                                                            setFieldValue(
                                                                'selectedContactIds',
                                                                values.selectedContactIds.filter((id) => id !== Number(contact.id)),
                                                            );
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-sm text-slate-800">{contact.names}</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{contact.phone}</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{contact.email || '-'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {recipientInputMode === 'upload' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-900">Upload Recipients File</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Upload a `.csv` or `.txt` file with recipient data.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Recipient file</label>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={(event) => onRecipientFileUpload(event, setFieldValue)}
                                className="block h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isParsingRecipientsFile}
                            className="h-11 border-slate-200 bg-white hover:bg-slate-100"
                        >
                            {isParsingRecipientsFile ? 'Processing...' : 'Import Recipients'}
                        </Button>
                    </div>

                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        Expected columns: `name`, `phone`, `email` (header optional). One recipient per line.
                    </div>

                    {uploadedRecipientFileName ? (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            Uploaded file: <span className="font-medium">{uploadedRecipientFileName}</span>
                        </div>
                    ) : null}

                    {values.recipients.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                                Imported recipients ({values.recipients.length})
                            </div>
                            <table className="w-full">
                                <thead className="bg-white">
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                </tr>
                                </thead>
                                <tbody>
                                {values.recipients.slice(0, 8).map((recipient) => (
                                    <tr key={recipient.id} className="border-b border-slate-100 text-sm last:border-0">
                                        <td className="px-4 py-2 text-slate-800">{recipient.names}</td>
                                        <td className="px-4 py-2 text-slate-700">{recipient.phone}</td>
                                        <td className="px-4 py-2 text-slate-700">{recipient.email || '-'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
