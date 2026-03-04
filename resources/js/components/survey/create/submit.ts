import type { RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import questions from '@/routes/questions';

interface SubmitSurveyPayloadParams {
    payload: RequestPayload;
    submissionAction: 'draft' | 'active';
    onFinish: () => void;
}

export const submitSurveyPayload = ({
    payload,
    submissionAction,
    onFinish,
}: SubmitSurveyPayloadParams): void => {
    router.post(questions.store().url, payload, {
        onSuccess: () => {
            toast.success(
                submissionAction === 'active'
                    ? 'Survey published successfully!'
                    : 'Survey saved as draft successfully!',
                {
                    position: 'top-center',
                    richColors: true,
                },
            );
            router.visit(questions.index().url);
        },
        onError: (validationErrors) => {
            console.error('Validation errors:', validationErrors);
            toast.error(
                'Failed to create survey. Please check your inputs.',
                {
                    position: 'top-center',
                    richColors: true,
                },
            );
        },
        onFinish,
    });
};
