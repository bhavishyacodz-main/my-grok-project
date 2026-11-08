# Product Requirements — Brandvika 2.0

## Product boundary

Brandvika is an employer-side recruitment workspace for small employers. Candidates submit applications without creating Brandvika accounts. It is not a candidate social network or general job marketplace.

## MVP requirements and status

| Requirement | Current status |
|---|---|
| Employer email/password account UI | Implemented in migration branch; live Auth configuration not verified |
| Employer Google sign-in UI | Implemented; provider setup and OAuth flow not verified |
| Email confirmation and password recovery UI | Implemented; email delivery and recovery flow not verified |
| Protected employer dashboard | Initial shell only |
| Employer profile onboarding | UI and authenticated Edge Function committed; not deployed or integration-tested |
| Employer profile editing and verification | Not migrated |
| Job draft creation and employer-scoped listing | UI and authenticated Edge Function committed; not deployed or integration-tested |
| Job editing, publishing and full lifecycle | Not migrated; publishing intentionally disabled |
| Four white-label hiring templates | Not migrated and not verified |
| Anonymous candidate applications | Not migrated |
| Private CV uploads | Not migrated |
| Applicant tracking and stage history | Not migrated |
| Five CV builder templates and selectable-text PDF | Not migrated and not verified |
| Moderation and platform-admin controls | Not migrated |
| Privacy requests, consent and retention workflows | Not migrated; legal placeholders only |
| RLS and Storage ownership policies | Design pending; none applied by this branch |
| Automated tests and accessibility checks | Test plan documented; suite pending |

## Required hiring templates

1. Small Business
2. Corporate
3. Creative / Gaming
4. Cultural / Festival

Each template must present the employer's own identity and retain a clear Privacy & Operator Information disclosure. Brandvika promotional branding must not be injected into employer hiring pages.

## Candidate privacy requirements

Candidates do not need accounts. Application data, contact information, CVs and application history must not be publicly enumerable. Submission and file handling must be validated server-side with rate limiting and duplicate detection.

## Release rule

A requirement is complete only when implementation and its relevant tests are verified. UI placeholders do not count as completed backend features.
