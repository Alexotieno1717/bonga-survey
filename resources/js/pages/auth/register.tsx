import { Form, Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register" />

            <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
                <section className="flex items-center justify-center px-6 py-10 md:px-10">
                    <div className="w-full max-w-md">
                        <Link href={home()} className="mb-8 inline-flex items-center gap-3 text-slate-900">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <AppLogoIcon className="size-6 fill-current" />
                            </span>
                            <span className="text-lg font-semibold">Bonga Survey</span>
                        </Link>

                        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create account</h1>
                            <p className="mt-2 text-sm text-slate-500">Set up your account to start running surveys.</p>

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                                disableWhileProcessing
                                className="mt-6 flex flex-col gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="name" className="text-slate-700">Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                name="name"
                                                placeholder="Enter your full name"
                                                className="h-11"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email" className="text-slate-700">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={2}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="Enter your email"
                                                className="h-11"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="password" className="text-slate-700">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                tabIndex={3}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder="Create a password"
                                                className="h-11"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="password_confirmation" className="text-slate-700">Confirm password</Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder="Confirm your password"
                                                className="h-11"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-1 h-11 w-full bg-teal-700 text-white hover:bg-teal-800"
                                            tabIndex={5}
                                            data-test="register-user-button"
                                        >
                                            {processing && <Spinner />}
                                            Create account
                                        </Button>

                                        <p className="text-center text-sm text-slate-500">
                                            Already have an account?{' '}
                                            <TextLink href={login()} tabIndex={6} className="font-medium no-underline">
                                                Log in
                                            </TextLink>
                                        </p>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </section>

                <section className="relative hidden overflow-hidden lg:flex">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#2dd4bf_0%,_transparent_34%),linear-gradient(145deg,#0a2b3f_10%,#0f172a_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-25" />
                    <div className="relative z-10 m-auto max-w-md px-10 text-white">
                        <p className="text-xs font-semibold tracking-[0.22em] text-teal-200 uppercase">Survey Platform</p>
                        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">
                            Build better surveys with confidence.
                        </h2>
                        <p className="mt-6 text-lg leading-relaxed text-slate-200">
                            Organize recipients, launch invitations, and track response performance from one focused workspace.
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}
