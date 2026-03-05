import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

type AddRecipientValues = {
    name: string;
    phone: string;
    email: string;
};

type AddContactsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddRecipient: (recipient: AddRecipientValues) => void;
};

const phoneNumberPattern = /^\+?\d{10,15}$/;

const validateRecipient = (values: AddRecipientValues): Partial<Record<keyof AddRecipientValues, string>> => {
    const validationErrors: Partial<Record<keyof AddRecipientValues, string>> = {};

    if (values.name.trim().length === 0) {
        validationErrors.name = 'Name is required';
    }

    if (values.phone.trim().length === 0) {
        validationErrors.phone = 'Phone number is required';
    } else if (!phoneNumberPattern.test(values.phone.trim())) {
        validationErrors.phone = 'Phone number is not valid';
    }

    if (values.email.trim().length === 0) {
        validationErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        validationErrors.email = 'Invalid email address';
    }

    return validationErrors;
};

const AddContactsModal = ({
    isOpen,
    onClose,
    onAddRecipient,
}: AddContactsModalProps) => {
    const { data, setData } = useForm<AddRecipientValues>({
        name: '',
        phone: '',
        email: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof AddRecipientValues, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof AddRecipientValues, boolean>>>({});

    const setFieldTouched = (field: keyof AddRecipientValues): void => {
        setTouched((previousTouched) => {
            return {
                ...previousTouched,
                [field]: true,
            };
        });
    };

    const handleFieldChange = (field: keyof AddRecipientValues, value: string): void => {
        setData(field, value);
        setErrors((previousErrors) => {
            if (!previousErrors[field]) {
                return previousErrors;
            }

            const nextErrors = { ...previousErrors };
            delete nextErrors[field];

            return nextErrors;
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        setTouched({
            name: true,
            phone: true,
            email: true,
        });

        const validationErrors = validateRecipient(data);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        try {
            onAddRecipient(data);
            onClose();
        } catch (error) {
            console.error('Error adding recipient:', error);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/70" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-lg">
                    <DialogTitle className="text-lg font-bold text-gray-900">
                        Add new recipient
                    </DialogTitle>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter name"
                                value={data.name}
                                onBlur={() => {
                                    setFieldTouched('name');
                                }}
                                onChange={(event) => {
                                    handleFieldChange('name', event.target.value);
                                }}
                            />
                            {touched.name && errors.name ? (
                                <div className="text-sm text-red-500">
                                    {errors.name}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter phone number"
                                value={data.phone}
                                onBlur={() => {
                                    setFieldTouched('phone');
                                }}
                                onChange={(event) => {
                                    handleFieldChange('phone', event.target.value);
                                }}
                            />
                            {touched.phone && errors.phone ? (
                                <div className="text-sm text-red-500">
                                    {errors.phone}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter email"
                                value={data.email}
                                onBlur={() => {
                                    setFieldTouched('email');
                                }}
                                onChange={(event) => {
                                    handleFieldChange('email', event.target.value);
                                }}
                            />
                            {touched.email && errors.email ? (
                                <div className="text-sm text-red-500">
                                    {errors.email}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Add Recipient</Button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default AddContactsModal;
