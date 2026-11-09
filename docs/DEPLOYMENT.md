# Deployment

## Current target

- Git branch: `codex/brandvika-v2-supabase-migration`
- Hosting: Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install --no-audit --no-fund`

The Vercel configuration uses an SPA rewrite to `index.html` for frontend routes. API routes are intentionally not rewritten to the SPA; trusted operations are planned as Supabase Edge Functions.

## Preview environment variables

Configure only in the Vercel Preview environment for the development branch:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use a dedicated development Supabase project. Do not add service-role or secret keys to Vercel client-visible variables.

## Supabase Edge Function setup still required

Deploy `employer-bootstrap` and `employer-jobs` only to the isolated development Supabase project after reviewing the code. Set the `ALLOWED_ORIGINS` Function secret to the exact development preview origin(s) and local development origin(s) that should call the functions. Supabase supplies its project URL, anon key and service-role key to the Edge Function runtime; do not copy the service-role key into Vercel or browser variables. Test with a verified employer account and confirm cross-account job access is rejected.

## Supabase Auth setup still required

- Enable email/password sign-in and configure email confirmation.
- Configure Google OAuth in the development Supabase project.
- Add the Supabase callback URI shown on the Supabase Google provider page to Google Cloud Console's Authorized redirect URIs.
- Add the exact Vercel preview callback URL (`https://YOUR-PREVIEW.vercel.app/auth/callback`) to Supabase's redirect allow-list.
- Add `http://localhost:8080/auth/callback` for local Vite testing (the configured Vite dev server uses port 8080).
- The SPA derives callback URLs from the current site origin; do not hard-code `localhost` into deployed OAuth requests.
- Verify password recovery and email delivery with test accounts.

## Release gate

Do not merge to `main`, change production environment variables, change production Auth providers, apply schema migrations to production, or promote a Vercel deployment until the test suite, RLS review, migration backup and explicit owner approval are complete.


## Supabase Edge Function origin allowlist

Before deploying `employer-bootstrap` or `employer-jobs`, configure the Edge Function secret `ALLOWED_ORIGINS` as a comma-separated list of exact origins, for example:

```text
https://your-production-domain.example,https://your-preview-domain.example
```

Use the actual deployed origins for the environment being configured. Do not include paths, wildcards, credentials, or trailing slashes. The functions also allow the local development origins `http://localhost:8080` and `http://127.0.0.1:8080`. If `ALLOWED_ORIGINS` is empty, hosted preview/production browser requests are denied by design. Keep service-role credentials only in Supabase Edge Function secrets; never add them to Vercel `VITE_*` variables.
