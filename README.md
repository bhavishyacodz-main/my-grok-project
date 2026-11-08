# Brandvika 2.0

Brandvika is an employer-focused recruitment workspace. Employers manage their organisation, jobs and applicants. Candidates apply without creating a Brandvika account.

## Current migration branch

This branch is the isolated React + Vite + TypeScript + React Router v6 + Supabase Auth migration. It is not the production branch and is not yet a complete release.

### Implemented in this branch

- Vite React SPA entry point and React Router v6 route setup.
- Supabase browser client using a publishable key only.
- Employer email/password registration and sign-in.
- Google OAuth sign-in entry point.
- Email confirmation messaging and password reset flow.
- Protected employer dashboard shell.
- Vercel SPA routing configuration.
- Environment example without credentials.

### Not yet implemented or verified

- Supabase Auth provider configuration and real OAuth/email delivery.
- Supabase database policies and isolated development database.
- Private CV and verification-document Storage.
- Edge Functions for anonymous candidate applications and server-side operations.
- Employer profile, job CRUD, hiring templates and applicant-management workflows.
- CV builder, PDF export and complete privacy request flows.
- Automated unit, integration, accessibility and browser test gates.
- Production deployment and release approval.

The dashboard deliberately identifies itself as a migration preview. Do not treat it as a finished hiring platform.

## Requirements

- Node.js 22 or later.
- npm.
- A dedicated Supabase development project is recommended. Do not point this branch at production data until a migration plan and backup have been reviewed.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` to your Supabase project URL.
3. Set `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key.
4. In Supabase Auth URL configuration, allow the local callback `http://localhost:8080/auth/callback`.
5. Enable Google only after configuring the Google provider in the development Supabase project.
6. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

## Build

```bash
npm run build
npm run preview
```

The build produces the static site in `dist/`.

## Environment security

- Only the Supabase project URL and publishable key may be exposed to the browser.
- Never add `service_role`, secret API keys, database passwords, OAuth client secrets or private credentials to `VITE_*` variables.
- Never commit `.env.local` or real credentials.
- Keep public candidate submissions behind a validated Edge Function; do not grant anonymous clients direct access to application tables.

## Production protection

The migration is being developed on `codex/brandvika-v2-supabase-migration`. The `main` branch, current Vercel production deployment and existing database records must remain unchanged until tests, migration review, backup verification and explicit release approval are complete.
