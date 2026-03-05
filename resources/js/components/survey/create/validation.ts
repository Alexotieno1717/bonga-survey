import { normalizeFieldPath } from '@/components/survey/create/form-path';
import type { FormErrors, FormValues, Question } from '@/components/survey/create/types';

const isValidDateValue = (value: Date | null): value is Date => {
    return value instanceof Date && !Number.isNaN(value.getTime());
};

const startOfDay = (value: Date): Date => {
    const normalizedDate = new Date(value);
    normalizedDate.setHours(0, 0, 0, 0);

    return normalizedDate;
};

const addError = (errors: FormErrors, field: string, message: string): void => {
    if (!errors[field]) {
        errors[field] = message;
    }
};

const validateQuestion = (errors: FormErrors, question: Question, questionIndex: number): void => {
    const questionFieldPrefix = `questions.${questionIndex}`;

    if (question.question.trim().length === 0) {
        addError(errors, `${questionFieldPrefix}.question`, 'Question is required');
    }

    if (!['free-text', 'multiple-choice'].includes(question.responseType)) {
        addError(errors, `${questionFieldPrefix}.responseType`, 'Response Type is required');
    }

    if (question.responseType === 'multiple-choice') {
        if (question.options.length === 0) {
            addError(errors, `${questionFieldPrefix}.options`, 'At least one option is required');
        }

        question.options.forEach((option, optionIndex) => {
            if (option.trim().length === 0) {
                addError(errors, `${questionFieldPrefix}.options.${optionIndex}`, 'Option cannot be empty');
            }
        });
    }
};

export const validateSurveyCreateValues = (
    values: FormValues,
    existingTriggerWords: string[],
    today: Date,
): FormErrors => {
    const errors: FormErrors = {};

    if (values.surveyName.trim().length === 0) {
        addError(errors, 'surveyName', 'Survey Name is required');
    }

    if (values.description.trim().length === 0) {
        addError(errors, 'description', 'Description is required');
    }

    if (!isValidDateValue(values.startDate)) {
        addError(errors, 'startDate', 'Start date is required');
    } else if (startOfDay(values.startDate) < startOfDay(today)) {
        addError(errors, 'startDate', 'Start date cannot be in the past');
    }

    if (!isValidDateValue(values.endDate)) {
        addError(errors, 'endDate', 'End date is required');
    } else if (isValidDateValue(values.startDate) && values.endDate < values.startDate) {
        addError(errors, 'endDate', 'End Date must be after start date');
    }

    if (values.shortCode.trim().length === 0) {
        addError(errors, 'shortCode', 'Short code is required');
    }

    if (values.triggerWord.trim().length === 0) {
        addError(errors, 'triggerWord', 'Trigger word is required');
    } else if (existingTriggerWords.includes(values.triggerWord.trim().toLowerCase())) {
        addError(errors, 'triggerWord', 'This trigger word is already in use.');
    }

    values.questions.forEach((question, questionIndex) => {
        validateQuestion(errors, question, questionIndex);
    });

    return errors;
};

export const filterValidationErrorsByFields = (
    errors: FormErrors,
    fields: string[],
): FormErrors => {
    const normalizedFields = fields.map((field) => normalizeFieldPath(field));

    return Object.entries(errors).reduce<FormErrors>((filteredErrors, [field, message]) => {
        const matches = normalizedFields.some((normalizedField) => {
            return field === normalizedField || field.startsWith(`${normalizedField}.`);
        });

        if (matches) {
            filteredErrors[field] = message;
        }

        return filteredErrors;
    }, {});
};
