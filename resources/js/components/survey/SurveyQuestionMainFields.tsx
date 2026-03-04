import { ErrorMessage, Field } from 'formik';

interface SurveyQuestionMainFieldsProps {
    index: number;
    isSaved: boolean;
    onMarkEditing: () => void;
}

export default function SurveyQuestionMainFields({
    index,
    isSaved,
    onMarkEditing,
}: SurveyQuestionMainFieldsProps) {
    return (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                    Question Text
                </label>
                <Field
                    name={`questions[${index}].question`}
                    type="text"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    placeholder="Enter your question"
                    onFocus={() => {
                        if (isSaved) {
                            onMarkEditing();
                        }
                    }}
                />
                <span className="text-sm text-red-500">
                    <ErrorMessage name={`questions[${index}].question`} />
                </span>
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Response Type</label>
                <Field
                    name={`questions[${index}].responseType`}
                    as="select"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    onFocus={() => {
                        if (isSaved) {
                            onMarkEditing();
                        }
                    }}
                >
                    <option value="free-text">Free Text</option>
                    <option value="multiple-choice">Multiple Choice</option>
                </Field>
                <span className="text-sm text-red-500">
                    <ErrorMessage name={`questions[${index}].responseType`} />
                </span>
            </div>
        </div>
    );
}
