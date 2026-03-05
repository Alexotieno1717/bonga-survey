import type {
    GetFieldError,
    SetFieldTouched,
    SetFieldValue,
} from '@/components/survey/create/types';

interface SurveyQuestionMainFieldsProps {
    index: number;
    isSaved: boolean;
    question: string;
    responseType: 'free-text' | 'multiple-choice';
    setFieldValue: SetFieldValue;
    setFieldTouched: SetFieldTouched;
    getFieldError: GetFieldError;
    onMarkEditing: () => void;
}

export default function SurveyQuestionMainFields({
    index,
    isSaved,
    question,
    responseType,
    setFieldValue,
    setFieldTouched,
    getFieldError,
    onMarkEditing,
}: SurveyQuestionMainFieldsProps) {
    const questionField = `questions[${index}].question`;
    const responseTypeField = `questions[${index}].responseType`;

    return (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                    Question Text
                </label>
                <input
                    name={questionField}
                    type="text"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    placeholder="Enter your question"
                    value={question}
                    onFocus={() => {
                        if (isSaved) {
                            onMarkEditing();
                        }
                    }}
                    onBlur={() => {
                        setFieldTouched(questionField, true);
                    }}
                    onChange={(event) => {
                        setFieldValue(questionField, event.target.value);
                    }}
                />
                <span className="text-sm text-red-500">
                    {getFieldError(questionField) ?? ''}
                </span>
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Response Type</label>
                <select
                    name={responseTypeField}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    value={responseType}
                    onFocus={() => {
                        if (isSaved) {
                            onMarkEditing();
                        }
                    }}
                    onBlur={() => {
                        setFieldTouched(responseTypeField, true);
                    }}
                    onChange={(event) => {
                        setFieldValue(responseTypeField, event.target.value);
                    }}
                >
                    <option value="free-text">Free Text</option>
                    <option value="multiple-choice">Multiple Choice</option>
                </select>
                <span className="text-sm text-red-500">
                    {getFieldError(responseTypeField) ?? ''}
                </span>
            </div>
        </div>
    );
}
