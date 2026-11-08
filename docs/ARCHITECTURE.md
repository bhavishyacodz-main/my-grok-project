# Brandvika 2.0 Architecture

## Target

- Frontend: React, Vite, TypeScript, Tailwind CSS, Lucide React and React Router v6.
- Identity: Supabase Auth for employer accounts, email confirmation, password recovery and Google OAuth.
- Data: Supabase PostgreSQL with Row Level Security.
- Files: private Supabase Storage buckets.
- Trusted workflows: Supabase Edge Functions for public application intake, privileged moderation and operations.
- Hosting: Vercel static frontend deployment.
- Testing: Vitest, React Testing Library, Playwright and axe-based accessibility checks.

## Trust boundaries

1. Browser code uses only the Supabase project URL and publishable key.
2. Employer-owned database reads and writes require authenticated JWTs and explicit ownership RLS policies.
3. Anonymous candidates do not receive accounts and must not query or enumerate applications.
4. Candidate application submission, rate limiting, duplicate detection and file handling are performed by a validated Edge Function.
5. Service-role credentials are restricted to trusted Edge Function secrets and are never shipped to the browser.
6. Admin permissions are stored in a protected platform-admin table and are not derived from user-editable metadata.

## Migration strategy

The existing production application uses TanStack Start, Better Auth and a server-side PostgreSQL adapter. The new frontend is being introduced on a separate Git branch. Existing legacy code and database tables are retained during the transition; they are not dropped as part of this first frontend milestone.

Existing text user IDs are preserved. New Supabase Auth users have UUIDs, represented as text in current employer ownership columns where appropriate. A future data migration must explicitly map old identities to new identities if legacy employer data is to be carried forward. Do not assume Better Auth user IDs equal Supabase Auth UUIDs.

## Current branch status

The initial SPA entry, React Router pages, Supabase client and employer authentication UI have been added. The employer dashboard is a clearly marked shell. Database policy migrations, Edge Functions, file-storage migration and full feature parity remain pending. No production database migration has been applied.
