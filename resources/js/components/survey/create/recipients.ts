import { toast } from 'sonner';
import type { Contact, SetFieldValue } from '@/components/survey/create/types';

export const parseRecipientFile = (fileContent: string): Contact[] => {
    const splitCsvRow = (row: string): string[] => {
        return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    };

    const normalizeCsvValue = (value: string): string => {
        const trimmedValue = value.trim();
        const withoutQuotes = trimmedValue.replace(/^"(.*)"$/, '$1');

        return withoutQuotes.replace(/""/g, '"').trim();
    };

    const rows = fileContent
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean);

    if (rows.length === 0) {
        return [];
    }

    const normalizedHeaders = rows[0].toLowerCase();
    const hasHeader = normalizedHeaders.includes('phone') || normalizedHeaders.includes('name');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const headerColumns = hasHeader
        ? splitCsvRow(rows[0]).map((column) => normalizeCsvValue(column).toLowerCase())
        : [];

    const nameIndex = headerColumns.findIndex((column) => ['name', 'names', 'full_name'].includes(column));
    const phoneIndex = headerColumns.findIndex((column) => ['phone', 'phone_number', 'number', 'mobile'].includes(column));
    const emailIndex = headerColumns.findIndex((column) => ['email', 'email_address'].includes(column));

    const recipients = dataRows
        .map((row, index) => {
            const columns = splitCsvRow(row).map((column) => normalizeCsvValue(column));

            const phone = hasHeader
                ? (phoneIndex >= 0 ? (columns[phoneIndex] || '') : '')
                : (columns.length === 1 ? columns[0] : (columns[1] || columns[0] || ''));

            if (!phone) {
                return null;
            }

            const names = hasHeader
                ? (nameIndex >= 0 ? (columns[nameIndex] || `Recipient ${index + 1}`) : `Recipient ${index + 1}`)
                : (columns.length === 1 ? `Recipient ${index + 1}` : (columns[0] || `Recipient ${index + 1}`));

            const email = hasHeader
                ? (emailIndex >= 0 ? (columns[emailIndex] || '') : '')
                : (columns[2] || '');

            return {
                id: Date.now() + index,
                names,
                phone,
                email,
            } as Contact;
        })
        .filter((recipient): recipient is Contact => recipient !== null);

    const uniqueByPhone = recipients.filter((recipient, index, allRecipients) => {
        return allRecipients.findIndex((item) => item.phone === recipient.phone) === index;
    });

    return uniqueByPhone;
};

interface HandleRecipientFileUploadParams {
    event: React.ChangeEvent<HTMLInputElement>;
    setFieldValue: SetFieldValue;
    setUploadedRecipientFileName: (filename: string) => void;
    setIsParsingRecipientsFile: (isParsing: boolean) => void;
}

export const handleRecipientFileUpload = async ({
    event,
    setFieldValue,
    setUploadedRecipientFileName,
    setIsParsingRecipientsFile,
}: HandleRecipientFileUploadParams): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    setIsParsingRecipientsFile(true);

    try {
        const fileContent = await file.text();
        const parsedRecipients = parseRecipientFile(fileContent);

        if (parsedRecipients.length === 0) {
            toast.error('No valid recipients were found in the uploaded file.');
            return;
        }

        setFieldValue('recipientSelectionType', 'select');
        setFieldValue('recipients', parsedRecipients);
        setFieldValue('selectedContactIds', parsedRecipients.map((recipient) => Number(recipient.id)));
        setUploadedRecipientFileName(file.name);

        toast.success(`${parsedRecipients.length} recipients uploaded successfully.`);
    } catch {
        toast.error('Failed to process file. Please use a valid CSV or TXT file.');
    } finally {
        setIsParsingRecipientsFile(false);
        event.target.value = '';
    }
};
