import { useState } from "react";
import { ArrowLeft, Check, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { hiringTemplates, type HiringTemplateId } from "../lib/templates/catalog";

export function TemplatesPage() {
  const [selectedId, setSelectedId] = useState<HiringTemplateId>("small-business");
  const selected = hiringTemplates.find((template) => template.id === selectedId) ?? hiringTemplates[0];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">brandvika</Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-pine"><ArrowLeft className="size-4" /> Back home</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-pine">Hiring page design system</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">A hiring page that feels like your organisation.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">Choose a visual direction for your public vacancies. Each layout is designed to put the employer's identity first and keep role information clear.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Hiring page templates">
          {hiringTemplates.map((template) => (
            <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} aria-pressed={selectedId === template.id} className={`rounded-2xl border p-4 text-left transition ${selectedId === template.id ? "border-pine bg-white shadow-sm" : "border-line bg-card hover:border-pine/50"}`}>
              <span className="mb-4 block h-2 rounded-full" style={{ backgroundColor: template.accent }} />
              <span className="flex items-center justify-between gap-2 font-semibold">{template.name}{selectedId === template.id && <Check className="size-4 text-pine" />}</span>
              <span className="mt-2 block text-xs leading-5 text-muted">{template.audience}</span>
            </button>
          ))}
        </div>

        <section className="mt-8 grid items-start gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <aside className="rounded-2xl border border-line bg-card p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-white text-pine"><Palette className="size-5" /></span>
            <h2 className="mt-4 font-display text-2xl">{selected.name}</h2>
            <p className="mt-2 text-sm font-semibold text-pine">{selected.visualStyle}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{selected.description}</p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Included sections</p>
              <ul className="mt-3 space-y-2">
                {selected.sections.map((section) => <li key={section} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-pine" />{section}</li>)}
              </ul>
            </div>
            <p className="mt-6 rounded-xl border border-line bg-white p-3 text-xs leading-5 text-muted">Preview only. Selecting a template does not publish a page or save a setting yet.</p>
          </aside>

          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_25px_80px_-45px_rgba(28,25,21,.35)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Employer hiring page</p><p className="mt-1 text-sm font-semibold">Live design preview</p></div>
              <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-semibold text-muted">Sample content</span>
            </div>
            <div className="p-5 sm:p-8" style={{ backgroundColor: selected.surface }}>
              <div className="mx-auto max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: selected.accent }}>N</span>
                  <div><p className="font-semibold">Northstar Studio</p><p className="text-xs text-muted">Sample employer identity</p></div>
                </div>
                <div className="mt-12">
                  <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: selected.accent }}>{selected.name} · Careers</p>
                  <h3 className="mt-4 max-w-xl font-display text-3xl leading-tight sm:text-4xl">Make meaningful work with a thoughtful team.</h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-muted">This sample page shows how an employer can introduce its team, explain an opportunity and help applicants understand the next step.</p>
                </div>
                <article className="mt-9 rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Featured opportunity</p>
                  <h4 className="mt-3 font-display text-2xl">{selected.sampleRole}</h4>
                  <p className="mt-2 text-sm text-muted">{selected.sampleLocation}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{["Clear responsibilities", "Supportive team", "Learning opportunities"].map((item) => <span key={item} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: selected.surface, color: selected.accent }}>{item}</span>)}</div>
                  <span aria-disabled="true" className="mt-6 inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-white opacity-90" style={{ backgroundColor: selected.accent }}>Application preview · not active yet</span>
                </article>
                <div className="mt-6 border-t border-black/10 pt-4 text-xs leading-5 text-muted">Privacy & Operator Information · Sample page for design review. Final operator and privacy details must be supplied before publication.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
