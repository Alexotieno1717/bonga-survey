import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, CircleCheckBig, Clock4, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Bonga Survey">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#0f766e_0%,_transparent_40%),radial-gradient(circle_at_bottom_right,_#f59e0b_0%,_transparent_35%)] opacity-40" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />

                <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
                    <div className="inline-flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-300/30">
                            <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold tracking-wide text-emerald-300">Bonga Survey</p>
                            <p className="text-xs text-slate-300">Fast. Reliable. Insightful.</p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                            >
                                Open Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full border border-slate-400/40 px-5 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-300 hover:text-emerald-300"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-14 pt-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:pb-20 lg:pt-10">
                    <section>
                        <p className="mb-5 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                            Survey Platform
                        </p>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                            Create surveys people actually complete.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">
                            Launch polished survey campaigns, monitor live response trends, and make faster
                            decisions with a dashboard built for clear insights.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                >
                                    Continue to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                    >
                                        Start Managing Surveys
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-full border border-slate-400/50 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-white"
                                        >
                                            Create Account
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-10 grid grid-cols-3 gap-3">
                            {[
                                { label: 'Survey Delivery', value: '99.9%' },
                                { label: 'Avg. Completion', value: '72%' },
                                { label: 'Daily Responses', value: '12k+' },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 backdrop-blur">
                                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                    <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-7">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Why teams use Bonga Survey</h2>
                            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-200 animate-pulse">
                                Live Analytics
                            </span>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    title: 'Audience Segmentation',
                                    detail: 'Group contacts by region, behavior, or campaign before sending surveys.',
                                    icon: Users,
                                    color: 'text-cyan-300 bg-cyan-300/15 ring-cyan-200/30',
                                },
                                {
                                    title: 'Real-time Monitoring',
                                    detail: 'Track open rates, responses, and drop-off points as submissions come in.',
                                    icon: BarChart3,
                                    color: 'text-emerald-300 bg-emerald-300/15 ring-emerald-200/30',
                                },
                                {
                                    title: 'Automated Follow-ups',
                                    detail: 'Improve completion rates with smart reminders based on survey activity.',
                                    icon: Clock4,
                                    color: 'text-amber-300 bg-amber-300/15 ring-amber-200/30',
                                },
                                {
                                    title: 'Secure Data Collection',
                                    detail: 'Collect responses with role-based access and protected respondent data.',
                                    icon: ShieldCheck,
                                    color: 'text-violet-300 bg-violet-300/15 ring-violet-200/30',
                                },
                            ].map((feature) => (
                                <article
                                    key={feature.title}
                                    className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 transition hover:border-slate-500"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${feature.color}`}>
                                            <feature.icon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-white">{feature.title}</h3>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-300">{feature.detail}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                            <p className="flex items-center gap-2 text-sm font-medium text-emerald-100">
                                <CircleCheckBig className="h-4 w-4" />
                                Built for teams that need actionable survey insights fast.
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
