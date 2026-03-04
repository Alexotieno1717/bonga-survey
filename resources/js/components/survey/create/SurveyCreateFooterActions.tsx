import { Transition } from '@headlessui/react';
import { MoveLeft, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SurveyCreateFooterActionsProps {
    currentStep: number;
    sendSurveyStep: number;
    isSubmitting: boolean;
    onBack: () => void;
    onNext: () => Promise<void>;
    onSaveAsDraft: () => Promise<void>;
    onPublish: () => Promise<void>;
}

export default function SurveyCreateFooterActions({
    currentStep,
    sendSurveyStep,
    isSubmitting,
    onBack,
    onNext,
    onSaveAsDraft,
    onPublish,
}: SurveyCreateFooterActionsProps) {
    return (
        <div className="py-6">
            <Transition
                as="div"
                show={true}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="flex justify-end gap-x-4">
                    {currentStep > 0 ? (
                        <Button
                            type="button"
                            className="space-x-2"
                            variant="outline"
                            onClick={onBack}
                        >
                            <MoveLeft />
                            <span>Back</span>
                        </Button>
                    ) : null}

                    {currentStep === 3 && sendSurveyStep === 3 ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-auto space-x-2 rounded-lg px-6 py-3 text-base font-semibold"
                                onClick={onSaveAsDraft}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save as Draft'}
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                className="w-auto space-x-2 rounded-lg border border-transparent px-6 py-3 text-base font-semibold shadow-sm focus:outline-none"
                                onClick={onPublish}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish Survey'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            onClick={onNext}
                            disabled={isSubmitting}
                        >
                            <span>{currentStep === 0 ? 'Save' : 'Next'}</span>
                            <MoveRight />
                        </Button>
                    )}
                </div>
            </Transition>
        </div>
    );
}
