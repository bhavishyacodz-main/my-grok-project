import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { SignInButtons } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-5 py-12 text-[#1c1915]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#e4d9c8] bg-[#fffcf7] p-8 shadow-[0_25px_80px_-40px_rgba(28,25,21,.35)] sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#6e655b] hover:text-[#0e6b52]">
          <ArrowLeft className="size-4" /> Back to Brandvika
        </Link>
        <div className="mt-9 grid size-12 place-items-center rounded-2xl bg-[#0e6b52] text-white">
          <BriefcaseBusiness className="size-6" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Welcome to Brandvika</h1>
        <p className="mt-3 leading-7 text-[#6e655b]">Sign in to continue to your hiring workspace.</p>
        {isPending ? (
          <p className="mt-8 text-sm text-[#6e655b]">Checking your session…</p>
        ) : user ? (
          <div className="mt-8 rounded-2xl bg-[#e8f2ec] p-5">
            <p className="font-semibold text-[#0e6b52]">You’re signed in.</p>
            <p className="mt-1 text-sm text-[#416b5b]">{user.displayName ?? user.primaryEmail}</p>
            <Link to="/" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#0e6b52]">Continue <span aria-hidden="true">→</span></Link>
          </div>
        ) : (
          <div className="mt-8">
            <SignInButtons />
            <p className="mt-6 text-center text-xs leading-5 text-[#8a7d6e]">By continuing, you agree to use Brandvika responsibly and provide accurate account information.</p>
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#eee5d9] pt-6 text-xs text-[#8a7d6e]">
          <ShieldCheck className="size-4 text-[#0e6b52]" /> Your account session is protected.
        </div>
      </section>
    </main>
  );
}
