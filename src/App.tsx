import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSupabaseAuth } from "./lib/auth/supabase-context";
import { TemplatesPage } from "./components/TemplatesPage";
import { validateEmployerCredentials } from "./lib/auth/validation";
import { validateEmployerProfile } from "./lib/employer/validation";
import { validateJobDraft, type JobDraftInput } from "./lib/jobs/validation";
import { supabase } from "./lib/supabase/client";
import { getAuthCallbackError } from "./lib/auth/callback-error";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="Brandvika home">
      <span className="grid size-10 place-items-center rounded-xl bg-pine text-white">
        <BriefcaseBusiness className="size-5" />
      </span>
      {!compact && <span className="text-xl font-semibold tracking-tight">brandvika</span>}
    </Link>
  );
}

function HomePage() {
  const { user } = useSupabaseAuth();
  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Brand />
        <nav className="flex items-center gap-3">
          <a href="#how-it-works" className="hidden text-sm text-muted hover:text-ink sm:inline">How it works</a>
          <Link to="/templates" className="hidden text-sm text-muted hover:text-ink sm:inline">Hiring templates</Link>
          <Link to={user ? "/dashboard" : "/login"} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:bg-white">
            {user ? "Workspace" : "Employer sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-pine">
            <ShieldCheck className="size-3.5" /> A clearer way to hire
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Good people.<span className="block text-pine">Good work.</span>Better together.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
            A thoughtful hiring workspace for small employers — from a clear job post to a more organised application process.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={user ? "/dashboard" : "/login"} className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-7 py-4 font-semibold text-white shadow-sm transition hover:bg-[#09563f]">
              {user ? "Open your workspace" : "Create an employer account"} <ArrowRight className="size-4" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-line bg-white/50 px-7 py-4 font-semibold hover:bg-white">
              Explore Brandvika
            </a>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-muted">
            <LockKeyhole className="size-5 text-pine" /> Employer accounts. Candidate applications without candidate accounts.
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#e7c9a8]/50 blur-3xl" />
          <div className="relative rounded-[2rem] border border-line bg-card p-5 shadow-[0_30px_90px_-45px_rgba(28,25,21,.35)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#eee5d9] pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">The hiring workspace</p>
                <h2 className="mt-1 font-display text-2xl">A better way forward</h2>
              </div>
              <span className="rounded-full bg-[#e8f2ec] px-3 py-1 text-xs font-semibold text-pine">Brandvika</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Feature icon={<Building2 />} title="Employer profiles" copy="Present your organisation with a clear identity." />
              <Feature icon={<BriefcaseBusiness />} title="Job publishing" copy="Create structured roles with clear expectations." />
              <Feature icon={<Users />} title="Applicant tracking" copy="Keep applications and hiring stages organised." />
              <Feature icon={<ShieldCheck />} title="Responsible hiring" copy="Keep consent, privacy and review in view." />
            </div>
            <div className="mt-6 rounded-2xl bg-[#f4efe6] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted">Our approach</p>
              <p className="mt-2 font-display text-xl leading-snug">Less noise in the process. More room for the right conversations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-3 lg:px-10">
          <Step number="01" title="Set up your presence" copy="Build an employer profile that tells people who you are and what you value." />
          <Step number="02" title="Share the opportunity" copy="Publish roles with clear expectations, location and application details." />
          <Step number="03" title="Move forward together" copy="Review applicants and keep each next step in one organised workspace." />
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>© {new Date().getFullYear()} Brandvika</span>
        <div className="flex gap-4"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><span>Privacy-first hiring</span></div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-[#eee5d9] bg-white p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ec] text-pine [&>svg]:size-5">{icon}</span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
    </div>
  );
}

function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div><p className="font-display text-3xl text-clay">{number}</p><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 max-w-sm leading-7 text-muted">{copy}</p></div>;
}

function LoginPage() {
  const auth = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.user) navigate("/dashboard", { replace: true });
    if (new URLSearchParams(location.search).get("reset") === "sent") {
      setMessage("If an account exists for that email, a password reset link has been sent.");
    }
  }, [auth.user, location.search, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEmployerCredentials(email, password, mode);
    if (!validation.ok) { setError(validation.message); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const confirmed = await auth.signUp(validation.email, password);
        setMessage(confirmed ? "Your account is ready. You can sign in now." : "Check your email and confirm your address before signing in.");
        setMode("signin");
      } else {
        await auth.signInWithPassword(validation.email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true); setError("");
    try { await auth.signInWithGoogle(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Google sign-in could not start."); setBusy(false); }
  }

  async function reset() {
    if (!email.trim()) { setError("Enter your email address first."); return; }
    setBusy(true); setError(""); setMessage("");
    try { await auth.sendPasswordReset(email.trim()); setMessage("If an account exists for that email, a password reset link has been sent."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the reset email."); }
    finally { setBusy(false); }
  }

  return (
    <AuthLayout>
      <Link to="/" className="text-sm text-muted hover:text-pine">← Back to Brandvika</Link>
      <div className="mt-8 grid size-12 place-items-center rounded-2xl bg-pine text-white"><BriefcaseBusiness className="size-6" /></div>
      <h1 className="mt-6 font-display text-3xl">{mode === "signup" ? "Create your employer account" : "Welcome back"}</h1>
      <p className="mt-3 leading-7 text-muted">Sign in to manage your organisation and hiring activity.</p>

      {!auth.isConfigured && <Notice tone="warning">Supabase is not connected yet. Add the two VITE_SUPABASE environment variables before testing sign-in.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      <button type="button" disabled={!auth.isConfigured || busy} onClick={() => void google()} className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 font-semibold hover:bg-[#faf7f1] disabled:opacity-50">
        <span className="font-bold text-lg">G</span> Continue with Google
      </button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" /> OR WITH EMAIL <span className="h-px flex-1 bg-line" /></div>

      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" placeholder="you@company.com" /></label>
        <label className="block text-sm font-semibold">Password<input required minLength={8} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" placeholder="At least 8 characters" /></label>
        <button type="submit" disabled={!auth.isConfigured || busy} className="w-full rounded-xl bg-pine px-4 py-3 font-semibold text-white hover:bg-[#09563f] disabled:opacity-50">{busy ? "Please wait…" : mode === "signup" ? "Create employer account" : "Sign in"}</button>
      </form>

      {mode === "signin" && <button type="button" disabled={!auth.isConfigured || busy} onClick={() => void reset()} className="mt-4 w-full text-center text-sm font-semibold text-pine hover:underline disabled:opacity-50">Forgot password?</button>}
      <p className="mt-6 text-center text-sm text-muted">
        {mode === "signup" ? "Already registered? " : "New to Brandvika? "}
        <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setMessage(""); }} className="font-semibold text-pine hover:underline">{mode === "signup" ? "Sign in" : "Create an employer account"}</button>
      </p>
      <div className="mt-8 flex items-center justify-center gap-2 border-t border-line pt-6 text-xs text-muted"><ShieldCheck className="size-4 text-pine" /> Secure employer authentication</div>
    </AuthLayout>
  );
}

function ResetPasswordPage() {
  const auth = useSupabaseAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await auth.updatePassword(password);
      setMessage("Password updated. You can continue to your workspace.");
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your password.");
    } finally { setBusy(false); }
  }

  return <AuthLayout><Link to="/login" className="text-sm text-muted">← Back to sign in</Link><h1 className="mt-8 font-display text-3xl">Choose a new password</h1><p className="mt-3 text-sm leading-6 text-muted">Use at least eight characters.</p>{error && <Notice tone="error">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}<form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4"><label className="block text-sm font-semibold">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal" /></label><button disabled={busy || !auth.isConfigured} className="w-full rounded-xl bg-pine px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Update password"}</button></form></AuthLayout>;
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const auth = useSupabaseAuth();
  const callbackError = getAuthCallbackError(new URLSearchParams(window.location.search));
  const [message, setMessage] = useState(
    callbackError ?? "Confirming your secure sign-in…",
  );

  useEffect(() => {
    if (callbackError) return;
    if (auth.loading) return;
    if (auth.user) navigate("/dashboard", { replace: true });
    else if (!auth.isConfigured) setMessage("Supabase is not configured for this deployment.");
    else setMessage("We could not confirm your sign-in. Please return to the login page and try again.");
  }, [auth.loading, auth.user, auth.isConfigured, navigate, callbackError]);

  return <AuthLayout><div className="text-center"><CheckCircle2 className="mx-auto size-10 text-pine" /><h1 className="mt-5 font-display text-2xl">Signing you in</h1><p role="status" className="mt-3 text-sm text-muted">{message}</p><Link to="/login" className="mt-6 inline-block font-semibold text-pine">Return to sign in</Link></div></AuthLayout>;
}

function EmployerOnboardingPage() {
  const auth = useSupabaseAuth();
  const navigate = useNavigate();
  const [employerType, setEmployerType] = useState<"individual" | "business">("business");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [contactEmail, setContactEmail] = useState(auth.user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEmployerProfile({ employerType, displayName, city, region, contactEmail });
    if (!validation.ok) { setError(validation.message); return; }
    if (!supabase) { setError("Supabase is not configured for this preview."); return; }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("employer-bootstrap", {
        body: validation.value,
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setMessage(data?.existing ? "An employer profile already exists. This milestone does not yet support editing existing profile details; no changes were saved." : "Your employer profile has been saved. Your public hiring page remains private until you choose to publish it.");
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 700);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your employer profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <Link to="/dashboard" className="text-sm text-muted hover:text-pine">← Back to workspace</Link>
      <div className="mt-8 grid size-12 place-items-center rounded-2xl bg-pine text-white"><Building2 className="size-6" /></div>
      <h1 className="mt-6 font-display text-3xl">Set up your employer profile</h1>
      <p className="mt-3 text-sm leading-7 text-muted">Add the basic details for your hiring workspace. Your public employer page will stay unpublished for now.</p>
      {!auth.isConfigured && <Notice tone="warning">Connect the development Supabase project before saving this profile.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold">Profile type</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className={`rounded-xl border p-3 text-sm ${employerType === "business" ? "border-pine bg-[#e8f2ec]" : "border-line bg-white"}`}>
              <input className="mr-2 accent-[#0e6b52]" type="radio" name="employerType" value="business" checked={employerType === "business"} onChange={() => setEmployerType("business")} />Business
            </label>
            <label className={`rounded-xl border p-3 text-sm ${employerType === "individual" ? "border-pine bg-[#e8f2ec]" : "border-line bg-white"}`}>
              <input className="mr-2 accent-[#0e6b52]" type="radio" name="employerType" value="individual" checked={employerType === "individual"} onChange={() => setEmployerType("individual")} />Individual
            </label>
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">Display name<input required minLength={2} maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your business or professional name" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">City<input maxLength={80} value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" /></label>
          <label className="block text-sm font-semibold">State / region<input maxLength={80} value={region} onChange={(event) => setRegion(event.target.value)} placeholder="State or region" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" /></label>
        </div>
        <label className="block text-sm font-semibold">Contact email<input required type="email" maxLength={254} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-pine" /></label>
        <button type="submit" disabled={busy || !auth.isConfigured} className="w-full rounded-xl bg-pine px-4 py-3 font-semibold text-white hover:bg-[#09563f] disabled:opacity-50">{busy ? "Saving profile…" : "Save employer profile"}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-muted">This creates a private draft profile. It does not verify a business, publish a hiring page or make any legal claims.</p>
    </AuthLayout>
  );
}

function RequireEmployer({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  if (auth.loading) return <LoadingPage />;
  if (!auth.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardPage() {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { await signOut(); navigate("/", { replace: true }); }
    catch { setBusy(false); }
  }
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Brand /><div className="flex items-center gap-4"><span className="hidden text-sm text-muted sm:inline">{user?.email}</span><button onClick={() => void logout()} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-white"><LogOut className="size-4" />{busy ? "Signing out…" : "Sign out"}</button></div></div></header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-pine">Employer workspace</p><h1 className="mt-2 font-display text-4xl">Your hiring dashboard</h1><p className="mt-3 text-muted">Signed in as {user?.email ?? "employer"}.</p></div><span className="rounded-full bg-[#fff1df] px-4 py-2 text-xs font-semibold text-[#8b4a1e]">Migration preview</span></div>
        <div className="mt-8 rounded-2xl border border-line bg-card p-6"><div className="flex items-start gap-3"><CircleHelp className="mt-1 size-5 shrink-0 text-pine" /><div><h2 className="font-semibold">Authentication foundation is connected in this branch</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">This is the first migration milestone, not the completed employer dashboard. Job management, application tracking, hiring-page templates and private CV storage will be migrated and tested in the next milestones. Your existing production app and data have not been changed.</p></div></div></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/onboarding" className="block rounded-2xl border border-line bg-card p-5 transition hover:border-pine"><span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ec] text-pine"><Building2 className="size-5" /></span><h2 className="mt-4 font-semibold">Employer profile</h2><p className="mt-2 text-sm leading-6 text-muted">Set up your organisation details and brand identity.</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-clay">Profile setup</p></Link>
          <Link to="/jobs" className="block rounded-2xl border border-line bg-card p-5 transition hover:border-pine"><span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ec] text-pine"><BriefcaseBusiness className="size-5" /></span><h2 className="mt-4 font-semibold">Jobs</h2><p className="mt-2 text-sm leading-6 text-muted">Create and manage private vacancy drafts.</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-clay">Draft management</p></Link>
          <WorkspaceCard icon={<Users />} title="Applicants" copy="Review applications and hiring stages" status="Next milestone" />
          <WorkspaceCard icon={<FileText />} title="CV builder" copy="Build and export candidate CVs" status="Next milestone" />
        </div>
      </div>
    </main>
  );
}

function WorkspaceCard({ icon, title, copy, status }: { icon: ReactNode; title: string; copy: string; status: string }) {
  return <section className="rounded-2xl border border-line bg-card p-5"><span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ec] text-pine [&>svg]:size-5">{icon}</span><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{copy}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-clay">{status}</p></section>;
}

type EmployerJob = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "paused" | "closed" | "archived";
  category: string;
  location: string;
  employment_type: string;
  work_mode: string;
  created_at: string;
};

function EmployerJobsPage() {
  const auth = useSupabaseAuth();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<JobDraftInput["employmentType"]>("full-time");
  const [workMode, setWorkMode] = useState<JobDraftInput["workMode"]>("onsite");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadJobs() {
    if (!supabase) { setLoading(false); setError("Supabase is not configured for this preview."); return; }
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("employer-jobs", { body: { action: "list" } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setJobs(Array.isArray(data?.jobs) ? data.jobs as EmployerJob[] : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, []);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateJobDraft({ title, category, description, location, employmentType, workMode });
    if (!validation.ok) { setError(validation.message); return; }
    if (!supabase) { setError("Supabase is not configured for this preview."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("employer-jobs", {
        body: { action: "create", ...validation.value },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setJobs((current) => [data.job as EmployerJob, ...current]);
      setTitle(""); setCategory(""); setDescription(""); setLocation("");
      setNotice("Draft saved. It is not public and cannot receive applications yet.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this job draft.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(jobId: string, status: "draft" | "archived") {
    if (!supabase) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("employer-jobs", {
        body: { action: "update_status", jobId, status },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setJobs((current) => current.map((job) => job.id === jobId ? data.job as EmployerJob : job));
      setNotice(status === "archived" ? "Job draft archived." : "Job moved back to draft.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Brand /><div className="flex items-center gap-4"><span className="hidden text-sm text-muted sm:inline">{auth.user?.email}</span><Link to="/dashboard" className="text-sm font-semibold text-pine">Workspace</Link></div></div></header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-pine">Employer workspace</p><h1 className="mt-2 font-display text-4xl">Your jobs</h1><p className="mt-3 text-muted">Create and organise vacancy drafts for your hiring pages.</p></div><span className="rounded-full bg-[#fff1df] px-4 py-2 text-xs font-semibold text-[#8b4a1e]">Draft-only milestone</span></div>
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-2xl">Create a job draft</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Drafts are private. Publishing will be enabled after the public hiring pages and application safeguards are ready.</p>
            <form onSubmit={(event) => void createDraft(event)} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">Job title<input required minLength={5} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Customer Support Associate" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal" /></label>
              <label className="block text-sm font-semibold">Category<input maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Customer service" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal" /></label>
              <label className="block text-sm font-semibold">Description<textarea required minLength={30} maxLength={12000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the role, responsibilities and expectations." className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal" /></label>
              <label className="block text-sm font-semibold">Location<input maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state or remote" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Employment type<select value={employmentType} onChange={(event) => setEmploymentType(event.target.value as JobDraftInput["employmentType"])} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 font-normal"><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="temporary">Temporary</option><option value="apprenticeship">Apprenticeship</option><option value="freelance">Freelance</option></select></label>
                <label className="block text-sm font-semibold">Work mode<select value={workMode} onChange={(event) => setWorkMode(event.target.value as JobDraftInput["workMode"])} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 font-normal"><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
              </div>
              <button type="submit" disabled={busy || !auth.isConfigured} className="w-full rounded-xl bg-pine px-4 py-3 font-semibold text-white hover:bg-[#09563f] disabled:opacity-50">{busy ? "Saving…" : "Save as private draft"}</button>
            </form>
          </section>
          <section className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl">Your vacancies</h2><p className="mt-1 text-sm text-muted">Only jobs owned by your account are returned.</p></div><button onClick={() => void loadJobs()} disabled={loading || busy} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-white">Refresh</button></div>
            {loading ? <p className="py-12 text-center text-sm text-muted">Loading your jobs…</p> : jobs.length === 0 ? <div className="py-12 text-center"><BriefcaseBusiness className="mx-auto size-8 text-pine" /><h3 className="mt-4 font-semibold">No job drafts yet</h3><p className="mt-2 text-sm text-muted">Create your first vacancy draft using the form.</p></div> : <div className="mt-6 space-y-3">{jobs.map((job) => <article key={job.id} className="rounded-xl border border-line bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-sm text-muted">{[job.category, job.location, job.employment_type, job.work_mode].filter(Boolean).join(" · ")}</p></div><span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold capitalize text-muted">{job.status.replace("_", " ")}</span></div><div className="mt-4 flex gap-2">{job.status === "archived" ? <button onClick={() => void changeStatus(job.id, "draft")} disabled={busy} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">Restore draft</button> : <button onClick={() => void changeStatus(job.id, "archived")} disabled={busy} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">Archive</button>}</div></article>)}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12 text-ink"><section className="w-full max-w-md rounded-[2rem] border border-line bg-card p-8 shadow-[0_25px_80px_-40px_rgba(28,25,21,.35)] sm:p-10">{children}</section></main>;
}

function Notice({ children, tone }: { children: ReactNode; tone: "warning" | "error" | "success" }) {
  const styles = { warning: "border-[#e8d2a4] bg-[#fff6df] text-[#76551b]", error: "border-[#e9c7c0] bg-[#fff0ed] text-danger", success: "border-[#c8dfd1] bg-[#edf7f0] text-pine" };
  return <p role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${styles[tone]}`}>{children}</p>;
}

function LoadingPage() {
  return <div className="grid min-h-screen place-items-center bg-paper text-muted">Loading your secure workspace…</div>;
}

export function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/templates" element={<TemplatesPage />} />
    <Route path="/dashboard" element={<RequireEmployer><DashboardPage /></RequireEmployer>} />
    <Route path="/onboarding" element={<RequireEmployer><EmployerOnboardingPage /></RequireEmployer>} />
    <Route path="/jobs" element={<RequireEmployer><EmployerJobsPage /></RequireEmployer>} />
    <Route path="/privacy" element={<AuthLayout><h1 className="font-display text-3xl">Privacy & Operator Information</h1><p className="mt-4 text-sm leading-7 text-muted">This page will contain the final operator identity, data practices, contact details and privacy request process before public launch. Those details must be supplied and verified by the platform owner.</p><Link to="/" className="mt-6 inline-block font-semibold text-pine">Back home</Link></AuthLayout>} />
    <Route path="/terms" element={<AuthLayout><h1 className="font-display text-3xl">Terms of Use</h1><p className="mt-4 text-sm leading-7 text-muted">The final terms must be reviewed and approved before public launch. This placeholder is not a legal agreement.</p><Link to="/" className="mt-6 inline-block font-semibold text-pine">Back home</Link></AuthLayout>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
