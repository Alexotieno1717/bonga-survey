import { Button } from '@/components/ui/button';

const DeleteConfirmationDialog = ({
    isOpen,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-bold">Delete Question</h2>
                <p className="mb-6 text-sm text-gray-600">
                    Are you sure you want to delete this question? This action
                    cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationDialog;
