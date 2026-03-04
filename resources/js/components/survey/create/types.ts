export interface Question {
    question: string;
    responseType: 'free-text' | 'multiple-choice';
    options: string[];
    optionSaveStates?: boolean[];
    allowMultiple?: boolean;
    freeTextDescription?: string;
    isSaved?: boolean;
    isSaving?: boolean;
    isEditing?: boolean;
    branching?: string | number | (string | number)[] | null;
}

export interface Contact {
    id: number;
    names: string;
    phone: string;
    email: string;
    gender?: 'male' | 'female';
    contact_group_id?: number;
}

export interface FormValues {
    submissionAction: 'draft' | 'active';
    isCompletionMessageSaved?: boolean;
    isSavingCompletionMessage?: boolean;
    surveyName: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    shortCode: string;
    triggerWord: string;
    questions: Question[];
    completionMessage?: string;
    recipients: Contact[];
    recipientSelectionType: 'all' | 'select';
    selectedContactIds: number[];
    invitationMessage: string;
    scheduleMode: 'now' | 'later';
    scheduleTime: string;
}

export interface SimulatorMessage {
    id: number;
    sender: 'system' | 'user' | 'muted';
    text: string;
}

export interface SimulatorSession {
    started: boolean;
    activeNode:
        | {
            kind: 'parent';
            questionIndex: number;
        }
        | {
            kind: 'child';
            parentQuestionIndex: number;
            optionIndex: number;
            childQuestionIndex: number;
            followUpBranching: string | null;
        }
        | null;
    messages: SimulatorMessage[];
}

export type SetFieldValue = (field: string, value: unknown) => void;
