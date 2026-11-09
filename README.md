# Brandvika 2.0

Brandvika is a recruitment-platform migration project. This branch contains a React + Vite + TypeScript frontend and a Supabase-backed employer workflow foundation.

> **Status: development preview — not production-ready.** The production branch and production database must remain unchanged until the migration is tested, reviewed, backed up and explicitly approved.

## Implemented on this branch

- React + Vite + TypeScript SPA with React Router v6 and Tailwind CSS.
- Supabase browser client using only the publishable key.
- Employer email/password sign-up and sign-in, Google OAuth entry point, email-confirmation handling, password recovery and auth callback handling.
- Deployment-aware OAuth and password-reset redirect URL helpers with unit tests.
- Protected employer dashboard shell.
- Employer profile onboarding UI and validation.
- `employer-bootstrap` Edge Function: authenticated employer profile bootstrap, with server-side validation and private draft profile creation.
- Employer job-draft UI and validation, including employer-scoped list, archive and restore actions.
- `employer-jobs` Edge Function: authenticated, owner-scoped draft operations. Job publishing is intentionally not enabled.
- Four interactive hiring-page template previews: Small Business, Corporate, Creative / Gaming, and Cultural / Festival.
- Product, known-limitations and testing documentation.

## Not yet complete or verified

- Google OAuth and email delivery have not been end-to-end tested against an isolated development Supabase project.
- Edge Functions are committed but not deployed or integration-tested.
- The existing Supabase production project has not been migrated by this branch. Production RLS policies and Storage buckets have not been changed.
- Candidate application intake, anonymous application submission, applicant tracking and hiring-stage workflows.
- Public employer pages, public job publishing and employer-specific template persistence.
- CV builder, PDF export and private CV/document storage.
- Complete privacy-request, moderation, reporting and retention workflows.
- Full browser, accessibility, database-policy and Edge Function integration tests.
- Legal pages remain placeholders and require confirmed operator details and appropriate review.
- Final production deployment, release approval and distributable ZIP.

See [Known Limitations](docs/KNOWN-LIMITATIONS.md), [Product Requirements](docs/PRODUCT-REQUIREMENTS.md) and [Testing](docs/TESTING.md) for the current scope.

## Requirements

- Node.js 22 or later
- npm
- A dedicated Supabase development project is recommended.

Do not connect this branch to production data while development database policies, migrations and test coverage are incomplete.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` to the development project's URL.
3. Set `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key.
4. Configure Supabase Auth redirect URLs to allow:
   - `http://localhost:8080/auth/callback`
   - `http://localhost:8080/reset-password`
5. Enable the Google provider only after configuring its credentials in the development Supabase project.
6. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

## Checks

```bash
npm run typecheck
npm run test:auth
npm run test
npm run lint
npm run build
```

A successful local check does not replace end-to-end testing against the configured development Supabase project.

## Environment and credential security

- Only the Supabase URL and publishable key belong in browser-exposed `VITE_*` variables.
- Never expose a Supabase service-role key, database password, OAuth client secret or other private credential in frontend code or a committed file.
- Keep `.env.local` and real credentials out of Git.
- Keep public candidate submissions behind a validated server-side function; do not grant anonymous clients direct table access.

## Branch and production protection

Development branch: `codex/brandvika-v2-supabase-migration`.

The `main` branch, current Vercel production deployment and existing production database records must remain unchanged until the migration is complete, tested, reviewed, backup-verified and explicitly approved for release.
