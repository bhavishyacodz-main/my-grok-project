# Security Notes

## Browser configuration

Allowed browser variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never expose database URLs, database passwords, Supabase service-role keys, Supabase secret keys, Google OAuth client secrets or admin credentials in browser bundles, source files or committed environment files.

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
