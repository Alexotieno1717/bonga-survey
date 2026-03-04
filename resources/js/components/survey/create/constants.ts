import type { FormValues } from '@/components/survey/create/types';

export const surveyCreateSteps = [
    { id: 1, label: 'Add Recipients' },
    { id: 2, label: 'Review Recipients' },
    { id: 3, label: 'Invitation' },
    { id: 4, label: 'Send' },
];

export const surveyCreateToday = new Date();
surveyCreateToday.setHours(0, 0, 0, 0);

export const surveyCreateInitialValues: FormValues = {
    submissionAction: 'active',
    surveyName: '',
    description: '',
    startDate: new Date(surveyCreateToday),
    endDate: null,
    shortCode: '20642',
    triggerWord: '',
    questions: [
        {
            question: '',
            responseType: 'free-text',
            options: [],
            optionSaveStates: [],
            allowMultiple: false,
            freeTextDescription: '',
            isSaved: true,
            branching: undefined,
        },
    ],
    completionMessage: '',
    isSavingCompletionMessage: false,
    recipients: [],
    recipientSelectionType: 'select',
    selectedContactIds: [],
    invitationMessage: '',
    scheduleMode: 'now',
    scheduleTime: '',
};
