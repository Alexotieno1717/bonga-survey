import { useField } from 'formik';
import type { FC } from 'react';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerProps {
    name: string;
    minDate?: Date;
    onSelectDate?: (date: Date | undefined) => void;
}

const DatePicker: FC<DatePickerProps> = ({ name, minDate, onSelectDate }) => {
    const [field, , helpers] = useField<Date | null>(name);

    return (
        <Calendar
            mode="single"
            selected={field.value ? new Date(field.value) : undefined}
            onSelect={(date) => {
                helpers.setValue(date ?? null);
                onSelectDate?.(date);
            }}
            disabled={(date) => (minDate ? date < minDate : false)}
            initialFocus
            fromDate={minDate}
        />
    );
};

export default DatePicker;
