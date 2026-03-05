interface SurveySearchFieldProps {
    name?: string;
    placeholder: string;
}

export default function SurveySearchField({
    name,
    placeholder,
}: SurveySearchFieldProps) {
    return (
        <input
            name={name}
            type="text"
            className="h-10 min-w-55 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            placeholder={placeholder}
        />
    );
}
