import { RotateCcw, SendHorizontal } from 'lucide-react';

interface SurveySimulatorMessage {
    id: number;
    sender: 'system' | 'user' | 'muted';
    text: string;
}

interface SurveySimulatorPanelProps {
    shortCode: string;
    messages: SurveySimulatorMessage[];
    hasPreviewQuestion: boolean;
    inputValue: string;
    onReset: () => void;
    onSend: () => void;
    onInputChange: (value: string) => void;
    onInputEnter: () => void;
}

export default function SurveySimulatorPanel({
    shortCode,
    messages,
    hasPreviewQuestion,
    inputValue,
    onReset,
    onSend,
    onInputChange,
    onInputEnter,
}: SurveySimulatorPanelProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        {shortCode.slice(0, 2)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{shortCode}</p>
                        <p className="text-xs text-slate-500">Survey Simulator</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    onClick={onReset}
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4">
                {messages.map((message) => {
                    const isEndMarker = message.text === '-- End of survey --';

                    return (
                        <div
                            key={message.id}
                            className={`rounded-xl px-3 py-2 text-sm shadow-sm ${
                                message.sender === 'user'
                                    ? 'ml-auto max-w-[95%] bg-blue-100 text-blue-900'
                                    : message.sender === 'muted'
                                        ? `max-w-[95%] bg-slate-100 text-slate-500 ${isEndMarker ? 'mx-auto text-center font-medium' : ''}`
                                        : 'max-w-[95%] bg-white text-slate-800'
                            }`}
                        >
                            <p className="whitespace-pre-line">{message.text}</p>
                        </div>
                    );
                })}
                {!hasPreviewQuestion ? (
                    <div className="max-w-[95%] rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                        Add your first question to preview and test the full SMS flow.
                    </div>
                ) : null}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(event) => {
                            onInputChange(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                onInputEnter();
                            }
                        }}
                        placeholder="Text message"
                        className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={onSend}
                        className="rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                        <SendHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
