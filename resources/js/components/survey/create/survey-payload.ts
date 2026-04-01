import type { ChildQuestionOptionState } from '@/components/ChildQuestionsModal';
import type { FormValues } from '@/components/survey/create/types';

interface BuildSurveyPayloadParams {
    values: FormValues;
    childQuestionStates: Record<string, ChildQuestionOptionState>;
    formattedStartDate: string;
    formattedEndDate: string;
    scheduleTime: string;
    submissionAction: FormValues['submissionAction'];
}

export const buildSurveyPayload = ({
    values,
    childQuestionStates,
    formattedStartDate,
    formattedEndDate,
    scheduleTime,
    submissionAction,
}: BuildSurveyPayloadParams): Record<string, unknown> => {
    return {
        status: submissionAction,
        surveyName: values.surveyName,
        description: values.description,
        createdWithAi: values.createdWithAi,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        triggerWord: values.triggerWord,
        completionMessage: values.completionMessage,
        invitationMessage: values.invitationMessage,
        scheduleTime,
        questions: values.questions.map((question, questionIndex) => {
            const branching: Array<string | number> | null = question.branching
                ? (Array.isArray(question.branching) ? question.branching : [question.branching])
                : null;

            return {
                question: question.question,
                responseType: question.responseType,
                options: question.options || [],
                allowMultiple: question.allowMultiple || false,
                freeTextDescription: question.freeTextDescription,
                branching,
                childQuestionStates: question.options.map((_, optionIndex) => {
                    const optionChildState = childQuestionStates[`${questionIndex}-${optionIndex}`];

                    if (!optionChildState) {
                        return null;
                    }

                    return {
                        followUpBranching: optionChildState.followUpBranching,
                        childQuestions: optionChildState.childQuestions.map((childQuestion) => {
                            return {
                                id: childQuestion.id,
                                question: childQuestion.question,
                                responseType: childQuestion.responseType,
                                branching: childQuestion.branching,
                                options: childQuestion.options,
                                optionSaveStates: childQuestion.optionSaveStates,
                                optionBranching: childQuestion.optionBranching,
                                allowMultiple: childQuestion.allowMultiple,
                                isSaved: childQuestion.isSaved,
                            };
                        }),
                    };
                }),
            };
        }),
        recipients: values.recipients.map((recipient) => ({
            id: recipient.id,
            names: recipient.names,
            phone: recipient.phone,
            email: recipient.email,
            gender: recipient.gender,
            contact_group_id: recipient.contact_group_id,
        })),
    };
};
