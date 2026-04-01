import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import SurveyBranchingSelect from '@/components/survey/SurveyBranchingSelect';
import AppLayout from '@/layouts/app-layout';
import questions from '@/routes/questions';
import {
    apply as surveyAiApply,
    generate as surveyAiGenerate,
    index as surveyAiIndex,
} from '@/routes/surveys/ai';
import type { BreadcrumbItem } from '@/types';

type AiResponseType = 'free-text' | 'multiple-choice';

interface AiQuestion {
    question: string;
    response_type: AiResponseType;
    options: string[];
    allow_multiple?: boolean;
    branching?: string | string[];
}

interface AiDraft {
    survey_name: string;
    questions: AiQuestion[];
}

interface PageProps extends InertiaPageProps {
    input: {
        survey_name: string | null;
        description: string;
    } | null;
    draft: AiDraft | null;
}

export default function Index() {
    const { input, draft } = usePage<PageProps>().props;
    const [aiDraft, setAiDraft] = useState<AiDraft | null>(draft);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const initialFormValues = useMemo(
        () => ({
            survey_name: input?.survey_name ?? '',
            description: input?.description ?? '',
        }),
        [input]
    );

    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
    } = useForm(initialFormValues);

    useEffect(() => {
        if (! draft) {
            setAiDraft(null);
            return;
        }

        setAiDraft({
            ...draft,
            questions: draft.questions.map((question) => {
                if (question.response_type === 'multiple-choice') {
                    const allowMultiple = Boolean(question.allow_multiple);
                    const branching = Array.isArray(question.branching) ? question.branching : [];
                    const normalizedBranching = question.options.map((_, index) => {
                        return branching[index] ?? '0';
                    });

                    return {
                        ...question,
                        allow_multiple: allowMultiple,
                        branching: allowMultiple
                            ? (typeof question.branching === 'string' ? question.branching : '0')
                            : normalizedBranching,
                    };
                }

                return {
                    ...question,
                    allow_multiple: false,
                    branching: typeof question.branching === 'string' ? question.branching : '0',
                };
            }),
        });
    }, [draft]);

    useEffect(() => {
        if (input) {
            setData({
                survey_name: input.survey_name ?? '',
                description: input.description,
            });
        }
    }, [input, setData]);

    const updateDraft = (updater: (current: AiDraft) => AiDraft): void => {
        setAiDraft((current) => {
            if (! current) {
                return current;
            }

            return updater(current);
        });
    };

    const updateQuestion = (index: number, nextQuestion: Partial<AiQuestion>): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            questions[index] = { ...questions[index], ...nextQuestion };

            return {
                ...current,
                questions,
            };
        });
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            const options = [...questions[questionIndex].options];
            options[optionIndex] = value;
            questions[questionIndex] = { ...questions[questionIndex], options };

            return {
                ...current,
                questions,
            };
        });
    };

    const toggleAllowMultiple = (questionIndex: number, allowMultiple: boolean): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            const currentQuestion = questions[questionIndex];

            if (currentQuestion.response_type !== 'multiple-choice') {
                return current;
            }

            const branching = allowMultiple
                ? (typeof currentQuestion.branching === 'string' ? currentQuestion.branching : '0')
                : currentQuestion.options.map((_, index) => {
                    if (Array.isArray(currentQuestion.branching)) {
                        return currentQuestion.branching[index] ?? '0';
                    }

                    return '0';
                });

            questions[questionIndex] = {
                ...currentQuestion,
                allow_multiple: allowMultiple,
                branching,
            };

            return {
                ...current,
                questions,
            };
        });
    };

    const addOption = (questionIndex: number): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            const options = [...questions[questionIndex].options, ''];
            let branching = questions[questionIndex].branching;

            if (
                questions[questionIndex].response_type === 'multiple-choice' &&
                !questions[questionIndex].allow_multiple
            ) {
                const existingBranching = Array.isArray(branching) ? branching : [];
                branching = [...existingBranching, '0'];
            }

            questions[questionIndex] = { ...questions[questionIndex], options, branching };

            return {
                ...current,
                questions,
            };
        });
    };

    const removeOption = (questionIndex: number, optionIndex: number): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            const options = questions[questionIndex].options.filter((_, index) => index !== optionIndex);
            let branching = questions[questionIndex].branching;

            if (
                questions[questionIndex].response_type === 'multiple-choice' &&
                !questions[questionIndex].allow_multiple
            ) {
                const existingBranching = Array.isArray(branching) ? branching : [];
                branching = existingBranching.filter((_, index) => index !== optionIndex);
            }

            questions[questionIndex] = { ...questions[questionIndex], options, branching };

            return {
                ...current,
                questions,
            };
        });
    };

    const handleResponseTypeChange = (questionIndex: number, value: AiResponseType): void => {
        updateDraft((current) => {
            const questions = [...current.questions];
            const currentQuestion = questions[questionIndex];
            const options = value === 'multiple-choice'
                ? (currentQuestion.options.length > 0 ? currentQuestion.options : ['', ''])
                : [];
            const branching = value === 'multiple-choice'
                ? options.map(() => '0')
                : '0';

            questions[questionIndex] = {
                ...currentQuestion,
                response_type: value,
                options,
                allow_multiple: value === 'multiple-choice' ? false : false,
                branching,
            };

            return {
                ...current,
                questions,
            };
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        clearErrors();
        post(surveyAiGenerate().url, {
            preserveScroll: true,
        });
    };

    const canSendToBuilder = useMemo(() => {
        if (! aiDraft) {
            return false;
        }

        if (aiDraft.survey_name.trim().length === 0) {
            return false;
        }

        return aiDraft.questions.every((question) => {
            if (question.question.trim().length === 0) {
                return false;
            }

            if (question.response_type === 'multiple-choice') {
                const options = question.options.map((option) => option.trim()).filter(Boolean);
                return options.length >= 2;
            }

            return true;
        });
    }, [aiDraft]);

    const handleSendToBuilder = (): void => {
        if (! aiDraft || isApplying) {
            return;
        }

        setIsApplying(true);

        const payload = {
            survey_name: aiDraft.survey_name,
            description: data.description,
            questions: aiDraft.questions.map((question) => ({
                question: question.question,
                response_type: question.response_type,
                allow_multiple: question.response_type === 'multiple-choice'
                    ? Boolean(question.allow_multiple)
                    : false,
                options: question.response_type === 'multiple-choice'
                    ? question.options
                    : [],
                branching: question.response_type === 'multiple-choice'
                    ? (question.allow_multiple
                        ? (typeof question.branching === 'string' ? question.branching : '0')
                        : (Array.isArray(question.branching) ? question.branching : []))
                    : (typeof question.branching === 'string' ? question.branching : '0'),
            })),
        };

        router.post(surveyAiApply().url, payload, {
            preserveScroll: true,
            onFinish: () => setIsApplying(false),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Survey Questions',
            href: questions.index().url,
        },
        {
            title: 'AI Survey',
            href: surveyAiIndex().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Survey" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 dark:text-[#BAD9FC]">
                <Card className="border-0 bg-gradient-to-r from-[#010618] via-[#16263a] to-[#2f4157] text-white shadow-lg">
                    <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                                <Sparkles className="h-5 w-5 text-white" />
                            </span>
                            <div>
                                <CardTitle className="text-2xl text-white">AI Survey Builder</CardTitle>
                                <p className="text-sm text-[#BAD9FC]">
                                    Describe the survey you want, and we will generate a draft you can edit.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card className="dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base dark:text-white">Describe Your Survey</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="survey-name" className="dark:text-[#BAD9FC]">Survey name (optional)</Label>
                                    <Input
                                        id="survey-name"
                                        value={data.survey_name}
                                        onChange={(event) => setData('survey_name', event.target.value)}
                                        placeholder="Leave blank to let AI name it"
                                        className="dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="survey-description" className="dark:text-[#BAD9FC]">Description</Label>
                                    <textarea
                                        id="survey-description"
                                        rows={6}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC] dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40"
                                        value={data.description}
                                        onChange={(event) => {
                                            if (errors.description) {
                                                clearErrors('description');
                                            }
                                            setData('description', event.target.value);
                                        }}
                                        placeholder="Example: Customer feedback survey for new mobile app. Ask for product satisfaction, feature requests, and issues. Keep it under 8 questions."
                                    />
                                    {errors.description ? (
                                        <p className="text-xs text-red-600">{errors.description}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground dark:text-[#BAD9FC]">
                                            Include the audience, goal, tone, and number of questions if you have one.
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" disabled={processing} className="gap-2 dark:bg-sky-400 dark:text-[#010618] dark:hover:bg-sky-300">
                                    {processing ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                    {processing ? 'Generating...' : 'Generate Draft'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/70 bg-slate-50/80 dark:border-[#4f6885] dark:bg-[#2f4157]/70">
                        <CardHeader>
                            <CardTitle className="text-base">What Works Best</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-[#BAD9FC]">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="font-semibold text-slate-700 dark:text-white">Be specific</p>
                                <p className="mt-1">Mention the audience, channel, and the outcome you want to learn.</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="font-semibold text-slate-700 dark:text-white">Set a range</p>
                                <p className="mt-1">Ask for a number of questions or a mix of question types.</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                <p className="font-semibold text-slate-700 dark:text-white">Review first</p>
                                <p className="mt-1">You can edit everything before creating the final survey.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-white via-white to-slate-50 shadow-xl dark:from-[#2f4157]/85 dark:via-[#2f4157]/70 dark:to-[#2f4157]/60">
                    <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-[#010618] via-[#16263a] to-[#2f4157] text-white dark:border-[#4f6885]">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                                <Sparkles className="h-4 w-4 text-white" />
                            </span>
                            <div>
                                <CardTitle className="text-base text-white">AI Draft</CardTitle>
                                <p className="text-xs text-slate-300">Polish the questions and flow before sending.</p>
                            </div>
                        </div>
                        {aiDraft ? (
                            <Badge variant="outline" className="border-white/20 text-xs text-slate-100">
                                {aiDraft.questions.length} questions
                            </Badge>
                        ) : null}
                    </CardHeader>
                    {processing ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-[#010618]/80">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white">
                                <Spinner className="h-4 w-4" />
                                AI is thinking...
                            </div>
                        </div>
                    ) : null}
                    <CardContent className="space-y-5 pt-6">
                        {aiDraft ? (
                            <>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#4f6885] dark:bg-[#010618]/35">
                                    <div className="space-y-2">
                                        <Label htmlFor="draft-name">Survey name</Label>
                                        <Input
                                            id="draft-name"
                                            value={aiDraft.survey_name}
                                            onChange={(event) => updateDraft((current) => ({
                                                ...current,
                                                survey_name: event.target.value,
                                            }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#4f6885] dark:bg-[#010618]/35">
                                    <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">
                                        Review and adjust the questions before sending them to the survey builder.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={handleSendToBuilder}
                                        disabled={!canSendToBuilder || isApplying}
                                        className="gap-2 bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 dark:bg-sky-400 dark:text-[#010618] dark:hover:bg-sky-300"
                                    >
                                        {isApplying ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                        Send to Survey Builder
                                    </Button>
                                </div>

                                <div className="space-y-5">
                                    {aiDraft.questions.map((question, index) => (
                                        <div
                                            key={`${index}-${question.question}`}
                                            className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-[#010618]/35 ${
                                                activeQuestionIndex === index
                                                    ? 'border-indigo-200 ring-2 ring-indigo-200/60 dark:border-sky-400/55 dark:ring-sky-400/30'
                                                    : 'border-slate-200 dark:border-[#4f6885]'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-sky-500/20 dark:text-sky-100">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                            Question {index + 1}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-[#BAD9FC]">Edit the question wording.</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="capitalize text-slate-600 dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">
                                                    {question.response_type.replace('-', ' ')}
                                                </Badge>
                                            </div>

                                            <textarea
                                                rows={3}
                                                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC] dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40"
                                                value={question.question}
                                                onFocus={() => setActiveQuestionIndex(index)}
                                                onBlur={() => setActiveQuestionIndex(null)}
                                                onChange={(event) => updateQuestion(index, { question: event.target.value })}
                                            />

                                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#4f6885] dark:bg-[#2f4157]/55">
                                                <div className="grid gap-3 md:grid-cols-[160px,1fr] md:items-center">
                                                    <Label className="text-sm text-slate-600 dark:text-[#BAD9FC]">Response type</Label>
                                                    <select
                                                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-[#5f7897] dark:bg-[#010618]/55 dark:text-[#BAD9FC] dark:focus:border-sky-400/70 dark:focus:ring-sky-900/40"
                                                        value={question.response_type}
                                                        onChange={(event) => handleResponseTypeChange(
                                                            index,
                                                            event.target.value as AiResponseType
                                                        )}
                                                    >
                                                        <option value="free-text">Free text</option>
                                                        <option value="multiple-choice">Multiple choice</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {question.response_type === 'multiple-choice' ? (
                                                <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 dark:border-[#4f6885] dark:from-[#2f4157]/65 dark:via-[#2f4157]/55 dark:to-[#2f4157]/65">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <Label className="text-sm font-semibold text-slate-700 dark:text-white">Options</Label>
                                                        <Badge variant="outline" className="text-xs text-slate-500 dark:border-[#6d87a8] dark:bg-[#010618]/40 dark:text-[#BAD9FC]">
                                                            {question.options.length} choices
                                                        </Badge>
                                                    </div>
                                                    <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-[#4f6885] dark:bg-[#010618]/35">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`allowMultiple-ai-${index}`}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 dark:border-[#6d87a8] dark:bg-[#010618]/60"
                                                                checked={Boolean(question.allow_multiple)}
                                                                onChange={(event) => {
                                                                    toggleAllowMultiple(index, event.target.checked);
                                                                }}
                                                            />
                                                            <Label
                                                                htmlFor={`allowMultiple-ai-${index}`}
                                                                className="text-sm font-medium text-slate-700 dark:text-[#BAD9FC]"
                                                            >
                                                                Allow participant to pick more than one option
                                                            </Label>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {question.options.map((option, optionIndex) => (
                                                            <div
                                                                key={`${index}-${optionIndex}`}
                                                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#4f6885] dark:bg-[#010618]/45"
                                                            >
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#BAD9FC]">
                                                                        Option {optionIndex + 1}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                                                                        onClick={() => removeOption(index, optionIndex)}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                                                    <Input
                                                                        value={option}
                                                                        onChange={(event) => updateOption(
                                                                            index,
                                                                            optionIndex,
                                                                            event.target.value
                                                                        )}
                                                                        placeholder={`Option ${optionIndex + 1}`}
                                                                    />
                                                                    {!question.allow_multiple ? (
                                                                        <div className="flex flex-col gap-1.5 lg:w-[220px] lg:flex-row lg:items-center lg:justify-end">
                                                                            <span
                                                                                className="text-xs text-slate-500 dark:text-[#BAD9FC] lg:whitespace-nowrap"
                                                                                title="After answer has been submitted, go to:"
                                                                                aria-label="After answer has been submitted, go to:"
                                                                            >
                                                                                →
                                                                            </span>
                                                                            <div className="min-w-[150px] flex-1">
                                                                                <SurveyBranchingSelect
                                                                                    currentQuestionIndex={index}
                                                                                    questionCount={aiDraft.questions.length}
                                                                                    noMoreLabel="-- No questions --"
                                                                                    value={
                                                                                        Array.isArray(question.branching)
                                                                                            ? (question.branching[optionIndex] ?? '0')
                                                                                            : '0'
                                                                                    }
                                                                                    onChange={(value) => {
                                                                                        const branching = Array.isArray(question.branching)
                                                                                            ? [...question.branching]
                                                                                            : [];
                                                                                        branching[optionIndex] = value;
                                                                                        updateQuestion(index, { branching });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-sky-400/60 dark:text-sky-100 dark:hover:bg-sky-500/20"
                                                            onClick={() => addOption(index)}
                                                        >
                                                            Add option
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {question.response_type === 'multiple-choice' && question.allow_multiple ? (
                                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#4f6885] dark:bg-[#2f4157]/55">
                                                    <Label className="mb-2 block text-sm text-slate-700 dark:text-[#BAD9FC]">
                                                        After answer has been submitted, go to:
                                                    </Label>
                                                    <SurveyBranchingSelect
                                                        currentQuestionIndex={index}
                                                        questionCount={aiDraft.questions.length}
                                                        noMoreLabel="-- No questions --"
                                                        value={typeof question.branching === 'string' ? question.branching : '0'}
                                                        onChange={(value) => updateQuestion(index, { branching: value })}
                                                    />
                                                </div>
                                            ) : null}

                                            {question.response_type === 'free-text' ? (
                                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#4f6885] dark:bg-[#2f4157]/55">
                                                    <Label className="mb-2 block text-sm text-slate-700 dark:text-[#BAD9FC]">
                                                        After answer has been submitted, go to:
                                                    </Label>
                                                    <SurveyBranchingSelect
                                                        currentQuestionIndex={index}
                                                        questionCount={aiDraft.questions.length}
                                                        noMoreLabel="-- No questions --"
                                                        value={typeof question.branching === 'string' ? question.branching : '0'}
                                                        onChange={(value) => updateQuestion(index, { branching: value })}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground dark:border-[#4f6885] dark:bg-[#010618]/35 dark:text-[#BAD9FC]">
                                Generate a draft to review questions here.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
