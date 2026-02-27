import { Form, Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Log in" />

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
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Log in</h1>
                            <p className="mt-2 text-sm text-slate-500">Welcome! Please enter your details.</p>

                            {status ? (
                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                    {status}
                                </div>
                            ) : null}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="mt-6 flex flex-col gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email" className="text-slate-700">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="Enter your email"
                                                className="h-11"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-slate-700">Password</Label>
                                                {canResetPassword ? (
                                                    <TextLink href={request()} className="text-xs no-underline" tabIndex={5}>
                                                        Forgot password?
                                                    </TextLink>
                                                ) : null}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Enter your password"
                                                className="h-11"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox id="remember" name="remember" tabIndex={3} />
                                            <Label htmlFor="remember" className="text-sm text-slate-600">Remember me</Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-1 h-11 w-full bg-teal-700 text-white hover:bg-teal-800"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            Sign in
                                        </Button>

                                        {canRegister ? (
                                            <p className="text-center text-sm text-slate-500">
                                                Don&apos;t have an account?{' '}
                                                <TextLink href={register()} tabIndex={5} className="font-medium no-underline">
                                                    Sign up
                                                </TextLink>
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </section>

                <section className="relative hidden overflow-hidden lg:flex">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee_0%,_transparent_34%),linear-gradient(145deg,#052e2b_10%,#0f172a_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-25" />
                    <div className="relative z-10 m-auto max-w-md px-10 text-white">
                        <p className="text-xs font-semibold tracking-[0.22em] text-cyan-200 uppercase">Insights Dashboard</p>
                        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">
                            Actionable insights at your fingertips.
                        </h2>
                        <p className="mt-6 text-lg leading-relaxed text-slate-200">
                            Create, send, and monitor surveys with real-time visibility to help your team make confident decisions.
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}
