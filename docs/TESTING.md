# Testing Strategy and Results

## Verified so far

- Vercel preview build completed successfully for the migration branch.
- The active React Router frontend passed `tsc --noEmit` in the Vercel build.
- Vite produced the static `dist/` bundle.

These checks do not verify authentication against a configured Supabase project, RLS, Storage, Edge Functions or user journeys.

## Pending automated tests

- Vitest unit tests for auth state, form validation and route guards.
- React Testing Library tests for employer sign-in, registration, password reset and loading/error states.
- Playwright browser tests for signup, email confirmation, Google OAuth callback, protected routes and sign-out.
- axe accessibility checks for public, login and dashboard pages.
- SQL/RLS tests for cross-employer isolation, candidate privacy and admin-only data.
- Edge Function tests for CORS, validation, rate limiting, duplicate applications and private file handling.

## Required release checks

1. Reconcile and commit the npm lockfile.
2. Run typecheck, lint, unit and integration tests.
3. Run production build.
4. Run browser and accessibility tests against a development preview.
5. Run RLS tests using at least two distinct employer identities and an anonymous role.
6. Run dependency, license and secret scans.
7. Record exact outcomes; never mark a test passed unless it was executed.
