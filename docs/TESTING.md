# Testing Strategy and Results

## Verified so far

- Vercel successfully ran `tsc --noEmit` for the active migration frontend.
- All 20 Node-based validation and catalogue tests passed in the Vercel build, including four new auth redirect URL tests.
- Vite completed the production build and generated `dist/`.
- The Supabase auth client now builds callback and password-recovery URLs from the current browser origin, with a unit test rejecting cross-origin callback targets.

These checks do not verify authentication against a configured development Supabase project, Google OAuth credentials, RLS, Storage, Edge Functions or complete user journeys.\n\n## Pending automated tests

- Vitest and React Testing Library component tests for auth state, forms and route guards.
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