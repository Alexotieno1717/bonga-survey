import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';

type AddContactsModalProps = {
    isOpen: boolean; // `isOpen` should be a boolean indicating if the modal is visible.
    onClose: () => void; // `onClose` is a function that closes the modal, with no arguments and no return value.
    onAddRecipient: (recipient: {
        name: string;
        phone: string;
        email: string;
    }) => void; // Callback to add a new recipient
};

// Validation schema using Yup
const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    phone: Yup.string()
        .required('Phone number is required')
        .matches(/^\+?\d{10,15}$/, 'Phone number is not valid'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

const AddContactsModal = ({
    isOpen,
    onClose,
    onAddRecipient,
}: AddContactsModalProps) => {
    const initialValues = {
        name: '',
        phone: '',
        email: '',
    };

    const handleSubmit = async (values: {
        name: string;
        phone: string;
        email: string;
    }) => {
        try {
            // Call the `onAddRecipient` callback to add the new recipient
            onAddRecipient(values);

            // Close the modal
            onClose();
        } catch (error) {
            console.error('Error adding recipient:', error);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70" />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-lg">
                    <DialogTitle className="text-lg font-bold text-gray-900">
                        Add new recipient
                    </DialogTitle>

                    {/* Formik Form */}
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-4">
                                {/* Name Field */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Name
                                    </label>
                                    <Field
                                        id="name"
                                        name="name"
                                        type="text"
                                        className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Enter name"
                                    />
                                    {errors.name && touched.name ? (
                                        <div className="text-sm text-red-500">
                                            {errors.name}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Phone Field */}
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Phone Number
                                    </label>
                                    <Field
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && touched.phone ? (
                                        <div className="text-sm text-red-500">
                                            {errors.phone}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Email
                                    </label>
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="mt-1 w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Enter email"
                                    />
                                    {errors.email && touched.email ? (
                                        <div className="text-sm text-red-500">
                                            {errors.email}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Button
                                        variant={'outline'}
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Add Recipient</Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default AddContactsModal;
