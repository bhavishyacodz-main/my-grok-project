-- Brandvika hiring data.
-- The application database role has full access, so ownership is enforced in
-- server functions (every employer query is scoped by the verified user id).
-- Applications are never cascade-deleted when a job is archived or removed.

create table if not exists employer_profiles (
  user_id text primary key,
  employer_type text not null check (employer_type in ('individual', 'business')),
  display_name text not null,
  slug text not null unique,
  headline text not null default '',
  description text not null default '',
  industry text not null default '',
  city text not null default '',
  region text not null default '',
  phone text not null default '',
  website text not null default '',
  social_links text not null default '',
  contact_email text not null default '',
  logo_data text not null default '',
  cover_data text not null default '',
  template_id text not null default 'small-business',
  brand_primary text not null default '#0E6B52',
  brand_accent text not null default '#C45C26',
  identity_accepted_at timestamptz,
  policies_accepted_at timestamptz,
  page_visible boolean not null default true,
  suspended_at timestamptz,
  suspension_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id text primary key,
  user_id text not null references employer_profiles (user_id),
  title text not null,
  slug text not null,
  status text not null check (status in ('draft', 'published', 'paused', 'closed', 'archived')),
  category text not null default '',
  description text not null default '',
  responsibilities text not null default '',
  qualifications text not null default '',
  skills_required text not null default '',
  skills_preferred text not null default '',
  experience text not null default '',
  employment_type text not null default '',
  location text not null default '',
  work_mode text not null default '',
  salary_min integer,
  salary_max integer,
  salary_currency text not null default 'INR',
  salary_visibility text not null default 'undisclosed' check (salary_visibility in ('disclosed', 'negotiable', 'undisclosed')),
  working_hours text not null default '',
  vacancies integer not null default 1 check (vacancies >= 1 and vacancies <= 999),
  deadline date,
  contact_email text not null default '',
  contact_phone text not null default '',
  min_age integer check (min_age is null or (min_age >= 14 and min_age <= 80)),
  form_mode text not null default 'standard' check (form_mode in ('standard', 'custom')),
  standard_fields text not null default '',
  caution_flags text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (user_id, slug)
);

create index if not exists jobs_user_idx on jobs (user_id);
create index if not exists jobs_status_idx on jobs (status);

create table if not exists application_questions (
  id text primary key,
  job_id text not null references jobs (id) on delete cascade,
  user_id text not null,
  sort_order integer not null,
  field_type text not null,
  label text not null,
  help_text text not null default '',
  required boolean not null default false,
  options_json text not null default '[]',
  maps_to text not null default ''
);

create index if not exists application_questions_job_idx on application_questions (job_id, sort_order);

create table if not exists applications (
  id text primary key,
  job_id text not null references jobs (id) on delete restrict,
  employer_user_id text not null,
  applicant_name text not null,
  email text not null default '',
  email_norm text not null default '',
  phone text not null default '',
  phone_norm text not null default '',
  city text not null default '',
  education text not null default '',
  experience text not null default '',
  skills text not null default '',
  stage text not null default 'applied' check (stage in (
    'applied', 'under_review', 'shortlisted', 'interview_scheduled',
    'interview_completed', 'selected', 'rejected', 'withdrawn'
  )),
  cv_filename text not null default '',
  cv_mime text not null default '',
  cv_data text not null default '',
  cv_source text not null default '' check (cv_source in ('', 'upload', 'builder')),
  answers_json text not null default '[]',
  search_text text not null default '',
  consent_at timestamptz not null,
  privacy_version text not null,
  age_confirmed boolean not null default false,
  manage_token_hash text not null unique,
  source text not null default 'direct',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  rating_skill integer check (rating_skill is null or (rating_skill between 1 and 5)),
  rating_experience integer check (rating_experience is null or (rating_experience between 1 and 5)),
  rating_communication integer check (rating_communication is null or (rating_communication between 1 and 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_employer_idx on applications (employer_user_id, created_at desc);
create index if not exists applications_job_idx on applications (job_id);
create unique index if not exists applications_job_email_idx on applications (job_id, email_norm) where email_norm <> '';
create unique index if not exists applications_job_phone_idx on applications (job_id, phone_norm) where phone_norm <> '';

create table if not exists application_answers (
  id text primary key,
  application_id text not null references applications (id) on delete restrict,
  employer_user_id text not null,
  question_key text not null,
  label text not null,
  value_text text not null default ''
);

create index if not exists application_answers_app_idx on application_answers (application_id);

create table if not exists application_stage_history (
  id text primary key,
  application_id text not null references applications (id) on delete restrict,
  employer_user_id text not null,
  from_stage text not null,
  to_stage text not null,
  created_at timestamptz not null default now()
);

create table if not exists employer_notes (
  id text primary key,
  application_id text not null references applications (id) on delete restrict,
  employer_user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists employer_notes_app_idx on employer_notes (application_id, created_at);

create table if not exists verification_requests (
  id text primary key,
  user_id text not null references employer_profiles (user_id),
  status text not null check (status in ('pending', 'approved', 'rejected', 'more_info', 'reverify')),
  legal_name text not null default '',
  document_label text not null default '',
  document_name text not null default '',
  document_mime text not null default '',
  document_data text not null default '',
  note text not null default '',
  reviewer_user_id text,
  reviewer_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists verification_requests_user_idx on verification_requests (user_id, created_at desc);

create table if not exists platform_reports (
  id text primary key,
  kind text not null check (kind in ('job', 'employer', 'abuse')),
  employer_slug text not null default '',
  job_slug text not null default '',
  reporter_email text not null default '',
  details text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists privacy_requests (
  id text primary key,
  kind text not null check (kind in ('access', 'correction', 'deletion', 'complaint')),
  email text not null,
  details text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'fulfilled', 'rejected')),
  reference_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists consent_records (
  id text primary key,
  application_id text not null references applications (id) on delete restrict,
  notice_version text not null,
  purpose text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  actor_user_id text not null default '',
  action text not null,
  entity text not null,
  entity_id text not null default '',
  meta text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on audit_logs (entity, entity_id);

create table if not exists rate_limits (
  bucket text primary key,
  count integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists platform_admins (
  user_id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists inquiries (
  id text primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);


-- Production hardening for the current Better Auth architecture.
-- Authentication and all application data are accessed only by the trusted
-- server-side PostgreSQL role. Do not expose these tables through the Supabase
-- Data API until policies are designed for the app's Better Auth identities.
create table if not exists _migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

do $brandvika_rls$
declare
  t record;
  role_name text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on table public.%I from public', t.tablename);
    foreach role_name in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = role_name) then
        execute format('revoke all on table public.%I from %I', t.tablename, role_name);
      end if;
    end loop;
  end loop;
end
$brandvika_rls$;

-- Future tables created by the migration/runtime database role are not
-- automatically readable or writable by the Data API roles.
alter default privileges in schema public
  revoke all on tables from public;

do $brandvika_default_privileges$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'alter default privileges in schema public revoke all on tables from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'alter default privileges in schema public revoke all on tables from authenticated';
  end if;
end
$brandvika_default_privileges$;


-- Cover the remaining foreign keys so deletes/joins remain efficient.
create index if not exists application_stage_history_application_idx
  on application_stage_history (application_id);
create index if not exists consent_records_application_idx
  on consent_records (application_id);
