# Known Limitations

- The new frontend is an initial migration shell, not a complete recruitment platform.
- Supabase Auth is not configured on a development project yet; Google and email flows are not end-to-end tested.
- The employer profile onboarding screen and `employer-bootstrap` Edge Function are committed but not deployed or end-to-end tested.
- The function requires Supabase Function secrets and an isolated development project before it can be used.
- The existing Supabase project remains untouched. No database policies or storage buckets have been created by this branch.
- Supabase branching requires a cost-confirmation step; no billable branch was created.
- Existing employer/jobs/applications operations still rely on legacy TanStack Start + Better Auth server functions and are not yet connected to the new SPA.
- The employer dashboard still lacks live database-backed metrics and full job/applicant workflows.
- The four hiring templates, five CV templates, candidate application intake, applicant tracking, moderation and privacy workflows remain to be migrated.
- The npm lockfile has not yet been regenerated and committed for the added dependencies. Vercel's install step resolved dependencies in its build environment.
- Active frontend typecheck, auth/profile validation tests and Vite production build are verified only when the latest preview deployment completes.
- No browser, RLS, Edge Function integration or accessibility tests have run.
- Legal pages are placeholders pending confirmed operator details and qualified review.