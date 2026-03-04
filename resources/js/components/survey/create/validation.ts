import * as Yup from 'yup';
import type { FormValues } from '@/components/survey/create/types';

export const buildSurveyCreateValidationSchema = (
    existingTriggerWords: string[],
    today: Date,
) => {
    return Yup.object().shape({
        surveyName: Yup.string().required('Survey Name is required'),
        description: Yup.string().required('Description is required'),
        startDate: Yup.date()
            .min(today, 'Start date cannot be in the past')
            .required('Start date is required'),
        endDate: Yup.date()
            .min(Yup.ref('startDate'), 'End Date must be after start date')
            .required('End date is required'),
        shortCode: Yup.string().required('Short code is required'),
        triggerWord: Yup.string()
            .required('Trigger word is required')
            .test(
                'unique-trigger-word',
                'This trigger word is already in use.',
                (value) => {
                    const normalizedValue = (value ?? '').trim().toLowerCase();

                    if (normalizedValue.length === 0) {
                        return true;
                    }

                    return !existingTriggerWords.includes(normalizedValue);
                },
            ),
        questions: Yup.array().of(
            Yup.object().shape({
                question: Yup.string().required('Question is required'),
                responseType: Yup.string()
                    .oneOf(['free-text', 'multiple-choice'])
                    .required('Response Type is required'),
                options: Yup.array()
                    .of(Yup.string().required('Option cannot be empty'))
                    .when('responseType', {
                        is: 'multiple-choice',
                        then: (schema) => schema.min(1, 'At least one option is required'),
                        otherwise: (schema) => schema.notRequired(),
                    }),
                allowMultiple: Yup.boolean(),
                freeTextDescription: Yup.string().notRequired(),
            }),
        ),
        completionMessage: Yup.string().notRequired(),
    }) as Yup.ObjectSchema<FormValues>;
};
