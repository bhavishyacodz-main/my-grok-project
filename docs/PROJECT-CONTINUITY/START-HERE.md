# Brandvika 2.0 — Start Here

## Safety boundary

All work belongs on `codex/brandvika-v2-supabase-migration`. Production `main`, the live Vercel deployment and existing Supabase data must remain unchanged.

## Current branch milestone

- Added Vite + React SPA entry.
- Added React Router v6 dependency and route shell.
- Added Supabase browser client using only the publishable key.
- Added employer email/password sign-up and sign-in, Google OAuth entry, email confirmation messaging and password reset.
- Added a protected dashboard preview shell.
- Added employer profile onboarding UI, server-side input validation and an `employer-bootstrap` Edge Function that verifies the Supabase user before creating a private draft profile.
- Added Vercel SPA rewrite configuration.
- Added `.env.example`, README and initial architecture/security/deployment docs.

## Important current limitations

- Dependencies and lockfile have not yet been reconciled by a local npm install.
- Vercel successfully ran tsc --noEmit for the active migration frontend and completed vite build; no local build was run because the container could not reach GitHub.
- Five employer-auth validation unit tests passed in the Vercel build. Browser, RLS, Edge Function and accessibility tests have not run.
- Supabase Auth provider configuration has not been changed.
- No database migration or RLS policy has been applied. The employer bootstrap function is committed but not deployed or tested against a development project. Supabase branch creation requested explicit cost confirmation, so no billable database branch was created.
- No Edge Functions or private Storage policies have been deployed.
- Existing employer/jobs/applications backend still uses the legacy TanStack Start + Better Auth server functions and has not yet been migrated.
- The dashboard is a shell, not a completed employer product.

## Next steps

1. Reconcile and commit the npm lockfile on this branch, then run build/typecheck/lint. Typecheck and Vite build currently pass on Vercel.
2. Create or confirm an isolated Supabase development project.
3. Implement reviewed RLS and private Storage migrations without touching production.
4. Complete the Supabase Auth callback and verify Google/email flows in preview.
5. Deploy and test `employer-bootstrap` on the isolated development project, then add owner-scoped profile update policies and a profile editing workflow.
6. Move jobs and applications operations into typed Edge Functions or safe RLS-backed client services.
7. Implement the four public hiring templates and five CV templates.
8. Add application intake, applicant tracking, moderation and privacy workflows.
9. Add Vitest, React Testing Library, Playwright, axe and SQL/RLS tests.
10. Produce and verify the requested `brandvika-mvp.zip`.
11. Request approval before any production migration or release.

## Credentials

Never place real secrets in this file. Use environment variable names only. If a credential was exposed in chat, rotate it and update the relevant secret store without sharing it in messages.
