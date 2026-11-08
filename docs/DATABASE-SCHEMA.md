# Database Schema and Migration Status

## Existing production schema (read-only during this migration)

The existing Supabase project contains these application tables: `employer_profiles`, `jobs`, `application_questions`, `applications`, `application_answers`, `application_stage_history`, `employer_notes`, `verification_requests`, `platform_reports`, `privacy_requests`, `consent_records`, `audit_logs`, `rate_limits`, `platform_admins` and `inquiries`. It also contains legacy Better Auth tables: `user`, `session`, `account` and `verification`.

RLS was previously enabled on the public tables. The existing design revoked direct `anon` and `authenticated` table privileges because the legacy application accesses data through a trusted server-side PostgreSQL adapter. This migration has not changed those grants or policies.

## Target identity model

New Supabase Auth identities use UUIDs. Existing employer ownership columns are text identifiers. New Supabase-owned records can use `auth.uid()::text` in those columns, but old Better Auth IDs must not be assumed to equal Supabase Auth UUIDs. A separate identity-mapping and data-transfer plan is required before legacy accounts are migrated.

## Target access model

- Employer profile and job records: authenticated owner-only access.
- Application records: employer owner-only reads and narrowly scoped updates.
- Application answers, notes and stage history: access through the owning employer/application relationship.
- Candidate application creation: trusted Edge Function only; no open anonymous table INSERT policy.
- CV and verification files: private buckets, with short-lived signed URLs issued only after server-side ownership checks.
- Admin, rate-limit, audit and moderation records: trusted server-side operations only.
- Legacy Better Auth tables: preserved until identity migration and rollback are verified.

## Migration status

No database migration has been applied by the migration branch. A Supabase development branch was not created because the branching operation requested explicit cost confirmation. No production schema, Auth-provider configuration or data was changed.
