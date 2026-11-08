import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const user = useCurrentUser();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1c1915]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="Brandvika home">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0e6b52] text-white">
            <BriefcaseBusiness className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">brandvika</span>
        </Link>
        <nav className="flex items-center gap-3">
          <a href="#how-it-works" className="hidden text-sm text-[#6e655b] hover:text-[#1c1915] sm:inline">How it works</a>
          <Link to="/login" className="rounded-full border border-[#d9cebd] px-5 py-2.5 text-sm font-semibold hover:bg-white">
            {user ? "Continue" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9cebd] bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0e6b52]">
            <Sparkles className="size-3.5" /> A clearer way to hire
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Good people.
            <span className="block text-[#0e6b52]">Good work.</span>
            Better together.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#6e655b]">
            Brandvika brings employers and applicants into one thoughtful space — from a clear job post to a more organised hiring conversation.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0e6b52] px-7 py-4 font-semibold text-white shadow-sm transition hover:bg-[#09563f]">
              {user ? "Open your workspace" : "Get started"} <ArrowRight className="size-4" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-[#d9cebd] bg-white/50 px-7 py-4 font-semibold hover:bg-white">
              Explore Brandvika
            </a>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-[#6e655b]">
            <ShieldCheck className="size-5 text-[#0e6b52]" />
            Thoughtful hiring, with privacy and clarity at the centre.
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#e7c9a8]/50 blur-3xl" />
          <div className="relative rounded-[2rem] border border-[#e4d9c8] bg-[#fffcf7] p-5 shadow-[0_30px_90px_-45px_rgba(28,25,21,.35)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#eee5d9] pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a7d6e]">The hiring workspace</p>
                <h2 className="mt-1 font-display text-2xl">A better way forward</h2>
              </div>
              <span className="rounded-full bg-[#e8f2ec] px-3 py-1 text-xs font-semibold text-[#0e6b52]">Brandvika</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Feature icon={<Building2 className="size-5" />} title="Employer profiles" copy="Present your organisation with a clear, consistent identity." />
              <Feature icon={<BriefcaseBusiness className="size-5" />} title="Job publishing" copy="Create structured roles with the details applicants need." />
              <Feature icon={<Users className="size-5" />} title="Applicant tracking" copy="Keep applications and hiring stages organised." />
              <Feature icon={<ShieldCheck className="size-5" />} title="Responsible hiring" copy="Keep consent, privacy and review in view." />
            </div>
            <div className="mt-6 rounded-2xl bg-[#f4efe6] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#8a7d6e]">Our approach</p>
              <p className="mt-2 font-display text-xl leading-snug">Less noise in the process. More room for the right conversations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#e4d9c8] bg-[#fffcf7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3 lg:px-10">
          <Step number="01" title="Set up your presence" copy="Build an employer profile that tells people who you are and what you value." />
          <Step number="02" title="Share the opportunity" copy="Publish roles with clear expectations, location and application details." />
          <Step number="03" title="Move forward together" copy="Review applicants and keep each next step in one organised workspace." />
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-[#6e655b] sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>© {new Date().getFullYear()} Brandvika</span>
        <span>Built for clearer, more considered hiring.</span>
      </footer>
    </main>
  );
}

function Feature({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-[#eee5d9] bg-white p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ec] text-[#0e6b52]">{icon}</span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6e655b]">{copy}</p>
    </div>
  );
}

function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-[#c45c26]">{number}</p>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm leading-7 text-[#6e655b]">{copy}</p>
    </div>
  );
}
