# RLS and Private Storage Policy Plan

This is a design document only. It is not a SQL migration and has not been applied to any Supabase project.

## Access matrix

| Data | Employer browser access | Anonymous browser access | Trusted Edge Function |
|---|---|---|---|
| Employer profile | Own row only | No direct table access | Read/write as required |
| Jobs | Own rows only | No direct table access; public jobs returned through a curated endpoint | Read published jobs; write after validation |
| Application questions | Only questions for jobs owned by the employer | No direct table access | Read public form definition |
| Applications | Own employer's applications; narrowly scoped status/rating updates | No direct SELECT or INSERT | Create and manage with validation |
| Application answers | Only through an owned application | No direct access | Create on submission |
| Stage history and notes | Only for owned applications | No direct access | Insert audit history |
| Verification requests | Own request metadata only | No direct access | Store and review documents |
| Reports, privacy requests, audit, rate limits, platform admins | No direct table access | No direct table access | Trusted server-side operations |

## Ownership predicates

The existing schema stores employer IDs as text. For new Supabase Auth identities, ownership checks should compare the stored ID with (select auth.uid())::text.

- employer_profiles.user_id
- jobs.user_id
- applications.employer_user_id
- application_questions: ownership through the referenced job
- application_answers, application_stage_history, employer_notes, and consent_records: ownership through the referenced application

A policy that only says TO authenticated is not sufficient. Every policy must enforce ownership. UPDATE policies need both USING and WITH CHECK, and the owner must also have a SELECT policy.

## Sensitive columns

Avoid granting broad SELECT * access on application records. In particular, manage_token_hash and legacy cv_data should not be exposed through normal browser queries. Use explicit column grants and a trusted download function that verifies the employer/job/application relationship before returning a short-lived signed URL.

## Candidate submission

Do not grant anon direct INSERT on applications or read access to application tables. Candidate submissions must go through a Supabase Edge Function that validates:
- the job exists and is currently published;
- the employer profile is visible and not suspended;
- required fields, email, phone and consent notice version;
- allowed file types and size limits;
- duplicate applications;
- rate limits and abuse signals.

The function should write application, answer, consent and stage-history records in a single controlled workflow. It must not return application enumeration data.

## Private Storage

Create new, private, versioned buckets for candidate CVs and employer verification documents. Do not make CVs or identity documents public. The Edge Function should upload candidate files using a service-role secret, while employer downloads should use a trusted function that first checks ownership and then returns a short-lived signed URL.

## Admin access

Do not authorize administrators from user-editable user metadata. Admin identity must be checked against the protected platform_admins table from trusted server-side code. Browser clients should not be able to add or modify platform-admin records.

## Migration and verification

1. Create an isolated development database and back it up before any schema change.
2. Generate a migration with the Supabase CLI and review it.
3. Apply only to the development database.
4. Test with two separate employer accounts and an anonymous client.
5. Verify cross-employer reads/updates fail, anonymous application enumeration fails, and signed CV access is limited to the owning employer.
6. Run Supabase security advisors.
7. Do not apply to production until the owner approves a separate release and backup plan.