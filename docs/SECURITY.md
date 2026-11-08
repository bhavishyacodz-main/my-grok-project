# Security Notes

## Browser configuration

Allowed browser variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never expose database URLs, database passwords, Supabase service-role keys, Supabase secret keys, Google OAuth client secrets or admin credentials in browser bundles, source files or committed environment files.

## Employer profile bootstrap function

`supabase/functions/employer-bootstrap` requires a valid Supabase access token and a verified email. It validates all profile input on the server and uses the service-role key only inside the Edge Function to create a profile whose `user_id` is the authenticated user's UUID. The service-role key must be configured as a Supabase Function secret and must never be copied into Vercel `VITE_*` variables.

The function fails closed for browser origins not listed in the `ALLOWED_ORIGINS` Supabase Function secret, apart from local development origins. Before deployment, set this secret to the exact production/preview origins intended to call the function.

## Employer job function

`supabase/functions/employer-jobs` verifies the caller's Supabase access token and confirmed email, checks that the employer profile belongs to the same auth UUID, and filters every job list/update by that UUID. Job creation always writes `status = draft`. The endpoint does not permit public publishing. The service-role key remains inside the Edge Function only.

## Authorization

- RLS must be enabled on every exposed table.
- Every employer-facing policy must include a row-ownership predicate, not merely `TO authenticated`.
- UPDATE policies require both `USING` and `WITH CHECK`, plus an appropriate SELECT policy.
- Candidate submissions must not be implemented as unrestricted anonymous INSERT permissions.
- Public job pages should expose only deliberately published job and employer fields.
- Applications, applicant contact information, CVs, notes, stage history and verification documents must never be publicly enumerable.
- Admin authorization must not trust user-editable metadata.

## Storage

CV and verification buckets must be private. Download access must be authorized against the owning employer/job/application relationship. Public object URLs are not suitable for applicant documents.

## Operational protections

- Keep production and development projects isolated.
- Back up before any schema or identity migration.
- Do not drop Better Auth tables or old records until a reviewed migration has been completed and verified.
- Audit dependency changes and lockfile changes.
- Do not claim legal compliance without qualified review and confirmed operator details.