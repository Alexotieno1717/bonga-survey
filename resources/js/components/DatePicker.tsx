import type { FC } from 'react';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerProps {
    value: Date | null;
    minDate?: Date;
    onSelectDate?: (date: Date | undefined) => void;
    onBlur?: () => void;
}

const DatePicker: FC<DatePickerProps> = ({ value, minDate, onSelectDate, onBlur }) => {
    return (
        <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
                onSelectDate?.(date);
                onBlur?.();
            }}
            disabled={(date) => (minDate ? date < minDate : false)}
            initialFocus
            fromDate={minDate}
        />
    );
};

export default DatePicker;
