import type { ChildQuestionOptionState } from '@/components/ChildQuestionsModal';
import type { Question } from '@/components/survey/create/types';

export const buildSimulatorQuestionText = (question: Question): string => {
    const questionText = question.question.trim();

    if (question.responseType !== 'multiple-choice') {
        return questionText;
    }

    const options = question.options
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

    if (options.length === 0) {
        return questionText;
    }

    const optionLines = options
        .map((option, index) => `${index + 1}. ${option}`)
        .join('\n');

    return `${questionText}\n${optionLines}`;
};

export const parseMultipleChoiceReply = (reply: string, options: string[]): number | null => {
    const normalizedReply = reply.trim().toLowerCase();

    if (normalizedReply.length === 0) {
        return null;
    }

    const numericReply = Number(normalizedReply);
    if (!Number.isNaN(numericReply) && numericReply >= 1 && numericReply <= options.length) {
        return numericReply - 1;
    }

    const exactMatchIndex = options.findIndex(
        (option) => option.trim().toLowerCase() === normalizedReply,
    );

    return exactMatchIndex === -1 ? null : exactMatchIndex;
};

export const resolveNextSimulatorQuestionIndex = (
    question: Question,
    currentIndex: number,
    totalQuestions: number,
    optionIndex: number | null = null,
): number => {
    let configuredTarget: unknown = null;

    if (
        question.responseType === 'multiple-choice' &&
        !question.allowMultiple &&
        optionIndex !== null &&
        Array.isArray(question.branching)
    ) {
        configuredTarget = question.branching[optionIndex] ?? null;
    } else {
        configuredTarget = question.branching;
    }

    const parsedTarget = Number(configuredTarget);
    let nextIndex = currentIndex + 1;

    if (configuredTarget !== null && configuredTarget !== undefined && configuredTarget !== '' && !Number.isNaN(parsedTarget)) {
        if (parsedTarget < 0) {
            return -1;
        }

        if (parsedTarget > 0) {
            nextIndex = parsedTarget;
        }
    }

    if (nextIndex < 0 || nextIndex >= totalQuestions) {
        return -1;
    }

    return nextIndex;
};

export const resolveNextParentQuestionIndexFromTarget = (
    target: unknown,
    currentIndex: number,
    totalQuestions: number,
): number => {
    const parsedTarget = Number(target);
    let nextIndex = currentIndex + 1;

    if (target !== null && target !== undefined && target !== '' && !Number.isNaN(parsedTarget)) {
        if (parsedTarget < 0) {
            return -1;
        }

        if (parsedTarget > 0) {
            nextIndex = parsedTarget;
        }
    }

    if (nextIndex < 0 || nextIndex >= totalQuestions) {
        return -1;
    }

    return nextIndex;
};

export const isBranchingEndTarget = (target: unknown): boolean => {
    if (target === null || target === undefined || target === '') {
        return false;
    }

    const parsedTarget = Number(target);

    return !Number.isNaN(parsedTarget) && parsedTarget < 0;
};

export const buildSimulatorChildQuestionText = (childQuestion: ChildQuestionOptionState['childQuestions'][number]): string => {
    const questionText = childQuestion.question.trim();

    if (childQuestion.responseType !== 'multiple-choice') {
        return questionText;
    }

    const options = (childQuestion.options ?? [])
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

    if (options.length === 0) {
        return questionText;
    }

    const optionLines = options
        .map((option, index) => `${index + 1}. ${option}`)
        .join('\n');

    return `${questionText}\n${optionLines}`;
};

export const resolveNextChildQuestionIndex = (
    childQuestion: ChildQuestionOptionState['childQuestions'][number],
    currentChildQuestionIndex: number,
    totalChildQuestions: number,
    optionIndex: number | null = null,
): number => {
    let target: unknown = childQuestion.branching;

    if (
        childQuestion.responseType === 'multiple-choice' &&
        !childQuestion.allowMultiple &&
        optionIndex !== null &&
        Array.isArray(childQuestion.optionBranching)
    ) {
        target = childQuestion.optionBranching[optionIndex] ?? childQuestion.branching;
    }

    const parsedTarget = Number(target);
    let nextChildQuestionIndex = currentChildQuestionIndex + 1;

    if (target !== null && target !== undefined && target !== '' && !Number.isNaN(parsedTarget)) {
        if (parsedTarget < 0) {
            return -1;
        }

        if (parsedTarget > 0) {
            nextChildQuestionIndex = parsedTarget - 1;
        }
    }

    if (nextChildQuestionIndex < 0 || nextChildQuestionIndex >= totalChildQuestions) {
        return -1;
    }

    return nextChildQuestionIndex;
};
