# Testing Strategy and Results

## Verified so far

- Vercel successfully ran `tsc --noEmit` for the active migration frontend.
- Five Node-based employer-auth validation unit tests passed.
- Vite completed the static production build and generated `dist/`.

These checks do not verify authentication against a configured Supabase project, RLS, Storage, Edge Functions or complete user journeys.

- Three Node-based hiring template catalogue tests added to the build test script; execution is pending the next preview build.\n\n## Pending automated tests

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