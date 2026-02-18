interface Question {
    question: string;
    responseType: 'free-text' | 'multiple-choice';
    options: string[];
    allowMultiple?: boolean;
    freeTextDescription?: string;
    isSaved?: boolean;
    isSaving?: boolean;
    isEditing?: boolean;
}

interface Recipient {
    id: string;
    name: string;
    phone: string;
    email: string;
}

interface FormValues {
    isCompletionMessageSaved?: boolean;
    surveyName: string;
    description: string;
    startDate: string;
    endDate: string;
    triggerWord: string;
    questions: Question[];
    completionMessage?: string;
    recipients: Recipient[];
    invitationMessage: string;
    scheduleTime: string;
}
