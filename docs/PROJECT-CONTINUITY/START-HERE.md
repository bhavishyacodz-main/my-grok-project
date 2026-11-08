# Brandvika 2.0 — Start Here

## Safety boundary

All work belongs on `codex/brandvika-v2-supabase-migration`. Production `main`, the live Vercel deployment and existing Supabase data must remain unchanged.

## Current branch milestone

- Added Vite + React SPA entry.
- Added React Router v6 dependency and route shell.
- Added Supabase browser client using only the publishable key.
- Added employer email/password sign-up and sign-in, Google OAuth entry, email confirmation messaging and password reset.
- Added a protected dashboard preview shell.
- Added Vercel SPA rewrite configuration.
- Added `.env.example`, README and initial architecture/security/deployment docs.

## Important current limitations

- Dependencies and lockfile have not yet been reconciled by a local npm install.
- No local build, typecheck or browser tests have been run in this environment.
- Supabase Auth provider configuration has not been changed.
- No database migration or RLS policy has been applied.
- No Edge Functions or private Storage policies have been deployed.
- Existing employer/jobs/applications backend still uses the legacy TanStack Start + Better Auth server functions and has not yet been migrated.
- The dashboard is a shell, not a completed employer product.

## Next steps

1. Reconcile and commit the npm lockfile on this branch, then run build/typecheck/lint.
2. Create or confirm an isolated Supabase development project.
3. Implement reviewed RLS and private Storage migrations without touching production.
4. Complete the Supabase Auth callback and verify Google/email flows in preview.
5. Move employer profile, jobs and applications operations into typed Edge Functions or safe RLS-backed client services.
6. Implement the four public hiring templates and five CV templates.
7. Add application intake, applicant tracking, moderation and privacy workflows.
8. Add Vitest, React Testing Library, Playwright, axe and SQL/RLS tests.
9. Produce and verify the requested `brandvika-mvp.zip`.
10. Request approval before any production migration or release.

## Credentials

Never place real secrets in this file. Use environment variable names only. If a credential was exposed in chat, rotate it and update the relevant secret store without sharing it in messages.
