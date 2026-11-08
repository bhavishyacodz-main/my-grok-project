# Changelog

## Unreleased — Supabase / React Router migration

- Created isolated Git branch `codex/brandvika-v2-supabase-migration`.
- Replaced the active Vite entry configuration with a React SPA build.
- Added React Router v6 and Supabase JS dependencies.
- Added Supabase client configuration using only a publishable browser key.
- Added employer email/password registration and sign-in, Google OAuth entry, email confirmation messaging and password recovery UI.
- Added a protected employer dashboard migration shell.
- Added Vercel SPA routing and Node 22 development version pin.
- Added architecture, product, database, security, privacy, testing, deployment and continuity documentation.
- Verified Vercel TypeScript check and Vite production build on the development branch.
- No production deployment, production environment variable, Supabase Auth provider, database schema or existing data was changed.
