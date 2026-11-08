import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { operator } from "@/lib/operator";
import type {
  EmployerInput,
  FilePayload,
  JobInput,
  JobStatus,
  PublicEmployer,
  PublicJob,
  PublicQuestion,
  QuestionInput,
  Stage,
  StandardFields,
  TemplateId,
} from "@/lib/types";
import { TEMPLATE_IDS } from "@/lib/types";
import {
  basicGaps,
  bytesToBase64,
  clip,
  fraudSignals,
  inspectCv,
  inspectEvidence,
  inspectImage,
  isJobStatus,
  isStage,
  isValidEmail,
  isValidPhone,
  jobIssues,
  likeContains,
  normaliseEmail,
  normalisePhone,
  normaliseQuestions,
  normaliseStandardFields,
  profileIssues,
  publishBlockers,
  randomToken,
  resolvedCity,
  resolvedEmail,
  resolvedName,
  resolvedPhone,
  salaryLabel,
  sha256,
  slugify,
  todayInIndia,
  validateApplication,
  validateSlug,
  type SniffedKind,
} from "@/lib/hiring-rules";
import type { ApplicationInput } from "@/lib/types";

const GENERIC_APPLY =
  "We could not file this application. If you already applied, use the private link from your confirmation page.";

function fail(message: string): never {
  throw new Error(message);
}

function stamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return value == null ? "" : String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function isUnique(error: unknown): boolean {
  const record = asRecord(error);
  if (record.code === "23505") return true;
  return /duplicate key/i.test(error instanceof Error ? error.message : String(error));
}

async function clientIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const header = getRequest().headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    return clip(header, 64);
  } catch {
    return "";
  }
}

async function bumpLimit(sql: Sql, bucket: string, limit: number, windowMinutes: number): Promise<boolean> {
  const rows = await sql<{ count: number; updated_at: string }>`
    select count, updated_at from rate_limits where bucket = ${bucket}
  `;
  const previous = rows[0];
  const stale =
    !previous || Date.now() - new Date(stamp(previous.updated_at)).getTime() > windowMinutes * 60_000;
  if (stale) {
    await sql`
      insert into rate_limits (bucket, count, updated_at) values (${bucket}, 1, now())
      on conflict (bucket) do update set count = 1, updated_at = now()
    `;
    return true;
  }
  if (Number(previous.count) >= limit) return false;
  await sql`update rate_limits set count = count + 1 where bucket = ${bucket}`;
  return true;
}

async function actor(sql: Sql, userId: string) {
  const users = await sql<{ email: string; email_verified: boolean }>`
    select email, "emailVerified" as email_verified from "user" where id = ${userId}
  `;
  const admins = await sql<{ user_id: string }>`
    select user_id from platform_admins where user_id = ${userId}
  `;
  return {
    email: users[0]?.email ?? "",
    emailVerified: Boolean(users[0]?.email_verified),
    isAdmin: Boolean(admins[0]),
  };
}

function numOrNull(value: number | null): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value));
}

function cleanProfile(input: EmployerInput): EmployerInput {
  const templateId = TEMPLATE_IDS.includes(input.templateId) ? input.templateId : "small-business";
  return {
    employerType: input.employerType === "business" ? "business" : "individual",
    displayName: clip(input.displayName, 120),
    slug: slugify(input.slug || input.displayName),
    headline: clip(input.headline, 160),
    description: clip(input.description, 4000),
    industry: clip(input.industry, 80),
    city: clip(input.city, 80),
    region: clip(input.region, 80),
    phone: clip(input.phone, 40),
    website: clip(input.website, 200),
    socialLinks: clip(input.socialLinks, 300),
    contactEmail: clip(input.contactEmail, 160),
    templateId,
    brandPrimary: clip(input.brandPrimary, 7),
    brandAccent: clip(input.brandAccent, 7),
    acceptIdentity: Boolean(input.acceptIdentity),
    acceptPolicies: Boolean(input.acceptPolicies),
    pageVisible: input.pageVisible !== false,
    logoData: input.logoData || "",
    coverData: input.coverData || "",
  };
}

function cleanJob(input: JobInput): JobInput {
  return {
    title: clip(input.title, 120),
    slug: slugify(input.slug || input.title),
    category: clip(input.category, 80),
    description: clip(input.description, 8000),
    responsibilities: clip(input.responsibilities, 4000),
    qualifications: clip(input.qualifications, 4000),
    skillsRequired: clip(input.skillsRequired, 1000),
    skillsPreferred: clip(input.skillsPreferred, 1000),
    experience: clip(input.experience, 160),
    employmentType: clip(input.employmentType, 40),
    location: clip(input.location, 160),
    workMode: clip(input.workMode, 40),
    salaryMin: numOrNull(input.salaryMin),
    salaryMax: numOrNull(input.salaryMax),
    salaryCurrency: clip(input.salaryCurrency || "INR", 8) || "INR",
    salaryVisibility:
      input.salaryVisibility === "disclosed" || input.salaryVisibility === "negotiable"
        ? input.salaryVisibility
        : "undisclosed",
    workingHours: clip(input.workingHours, 160),
    vacancies: Number.isFinite(input.vacancies) ? Math.round(input.vacancies) : 1,
    deadline: clip(input.deadline, 10),
    contactEmail: clip(input.contactEmail, 160),
    contactPhone: clip(input.contactPhone, 40),
    minAge: input.minAge == null ? null : Math.round(Number(input.minAge)),
    formMode: input.formMode === "custom" ? "custom" : "standard",
    standardFields: normaliseStandardFields(input.standardFields),
    questions: normaliseQuestions(input.questions ?? []),
  };
}

type ProfileRow = {
  user_id: string;
  employer_type: "individual" | "business";
  display_name: string;
  slug: string;
  headline: string;
  description: string;
  industry: string;
  city: string;
  region: string;
  phone: string;
  website: string;
  social_links: string;
  contact_email: string;
  logo_data: string;
  cover_data: string;
  template_id: TemplateId;
  brand_primary: string;
  brand_accent: string;
  identity_accepted_at: string | null;
  policies_accepted_at: string | null;
  page_visible: boolean;
  suspended_at: string | null;
  suspension_reason: string;
};

function toProfile(row: ProfileRow): EmployerInput & { suspended: boolean; suspensionReason: string } {
  return {
    employerType: row.employer_type,
    displayName: row.display_name,
    slug: row.slug,
    headline: row.headline,
    description: row.description,
    industry: row.industry,
    city: row.city,
    region: row.region,
    phone: row.phone,
    website: row.website,
    socialLinks: row.social_links,
    contactEmail: row.contact_email,
    templateId: TEMPLATE_IDS.includes(row.template_id) ? row.template_id : "small-business",
    brandPrimary: row.brand_primary,
    brandAccent: row.brand_accent,
    acceptIdentity: Boolean(row.identity_accepted_at),
    acceptPolicies: Boolean(row.policies_accepted_at),
    pageVisible: row.page_visible,
    logoData: row.logo_data,
    coverData: row.cover_data,
    suspended: Boolean(row.suspended_at),
    suspensionReason: row.suspension_reason,
  };
}

async function imageField(dataUrl: string, label: string): Promise<string> {
  if (!dataUrl) return "";
  if (!dataUrl.startsWith("data:")) fail(`${label} could not be read.`);
  const inspected = inspectImage({ name: `${label}.img`, dataBase64: dataUrl }, label);
  if (!inspected.ok) fail(inspected.error);
  return `data:${inspected.mime};base64,${inspected.data}`;
}

async function loadProfile(sql: Sql, userId: string) {
  const rows = await sql<ProfileRow>`select * from employer_profiles where user_id = ${userId}`;
  return rows[0] ? toProfile(rows[0]) : null;
}

type JobRow = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  status: JobStatus;
  category: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  skills_required: string;
  skills_preferred: string;
  experience: string;
  employment_type: string;
  location: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_visibility: "disclosed" | "negotiable" | "undisclosed";
  working_hours: string;
  vacancies: number;
  deadline: string | null;
  contact_email: string;
  contact_phone: string;
  min_age: number | null;
  form_mode: "standard" | "custom";
  standard_fields: string;
  caution_flags: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

async function questionsFor(sql: Sql, jobId: string): Promise<QuestionInput[]> {
  const rows = await sql<{
    id: string;
    field_type: QuestionInput["type"];
    label: string;
    help_text: string;
    required: boolean;
    options_json: string;
    maps_to: QuestionInput["mapsTo"];
  }>`
    select id, field_type, label, help_text, required, options_json, maps_to
    from application_questions where job_id = ${jobId} order by sort_order
  `;
  return rows.map((row) => ({
    id: row.id,
    type: row.field_type,
    label: row.label,
    help: row.help_text,
    required: row.required,
    options: JSON.parse(row.options_json || "[]") as string[],
    mapsTo: row.maps_to || "",
  }));
}

function jobInputFrom(row: JobRow, questions: QuestionInput[]): JobInput {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    description: row.description,
    responsibilities: row.responsibilities,
    qualifications: row.qualifications,
    skillsRequired: row.skills_required,
    skillsPreferred: row.skills_preferred,
    experience: row.experience,
    employmentType: row.employment_type,
    location: row.location,
    workMode: row.work_mode,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    salaryVisibility: row.salary_visibility,
    workingHours: row.working_hours,
    vacancies: Number(row.vacancies),
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : "",
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    minAge: row.min_age == null ? null : Number(row.min_age),
    formMode: row.form_mode,
    standardFields: normaliseStandardFields(JSON.parse(row.standard_fields || "{}") as StandardFields),
    questions,
  };
}

async function audit(sql: Sql, actorUserId: string, action: string, entity: string, entityId: string, meta = "") {
  await sql`
    insert into audit_logs (id, actor_user_id, action, entity, entity_id, meta)
    values (${crypto.randomUUID()}, ${actorUserId}, ${clip(action, 80)}, ${clip(entity, 80)}, ${clip(entityId, 80)}, ${clip(meta, 500)})
  `;
}

async function requireAdmin(sql: Sql, userId: string) {
  const who = await actor(sql, userId);
  if (!who.isAdmin) fail("This desk is only for operator accounts listed in platform_admins.");
  return who;
}

export const deskMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const who = await actor(sql, context.userId);
    const profile = await loadProfile(sql, context.userId);
    const latest = profile
      ? await sql<{ status: string }>`
          select status from verification_requests where user_id = ${context.userId} order by created_at desc limit 1
        `
      : [];
    return {
      userId: context.userId,
      email: who.email,
      emailVerified: who.emailVerified,
      isAdmin: who.isAdmin,
      profile,
      businessStatus: latest[0]?.status ?? null,
      basicGaps: basicGaps({
        emailVerified: who.emailVerified,
        phone: profile?.phone ?? "",
        identityAccepted: Boolean(profile?.acceptIdentity),
        policiesAccepted: Boolean(profile?.acceptPolicies),
      }),
    };
  });

export const deskOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const counts = await sql<{ jobs: number; published: number; applications: number; shortlisted: number }>`
      select
        (select count(*) from jobs where user_id = ${context.userId}) as jobs,
        (select count(*) from jobs where user_id = ${context.userId} and status = 'published') as published,
        (select count(*) from applications where employer_user_id = ${context.userId}) as applications,
        (select count(*) from applications where employer_user_id = ${context.userId} and stage = 'shortlisted') as shortlisted
    `;
    const recent = await sql<{ id: string; applicant_name: string; title: string; stage: string; created_at: string }>`
      select a.id, a.applicant_name, j.title, a.stage, a.created_at
      from applications a join jobs j on j.id = a.job_id
      where a.employer_user_id = ${context.userId}
      order by a.created_at desc limit 6
    `;
    return {
      counts: {
        jobs: Number(counts[0]?.jobs ?? 0),
        published: Number(counts[0]?.published ?? 0),
        applications: Number(counts[0]?.applications ?? 0),
        shortlisted: Number(counts[0]?.shortlisted ?? 0),
      },
      recent: recent.map((row) => ({
        id: row.id,
        name: row.applicant_name,
        jobTitle: row.title,
        stage: row.stage,
        createdAt: stamp(row.created_at),
      })),
    };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: EmployerInput) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const profile = cleanProfile(data);
    const issues = profileIssues(profile, "save");
    if (issues.length) fail(issues.join(" "));
    const logo = await imageField(profile.logoData, "Logo");
    const cover = await imageField(profile.coverData, "Cover image");
    const clash = await sql<{ user_id: string }>`
      select user_id from employer_profiles where slug = ${profile.slug} and user_id <> ${context.userId}
    `;
    if (clash[0]) fail("That page link is already used. Choose another.");
    const slugIssues = validateSlug(profile.slug, "Page link");
    if (slugIssues.length) fail(slugIssues.join(" "));
    await sql`
      insert into employer_profiles (
        user_id, employer_type, display_name, slug, headline, description, industry, city, region,
        phone, website, social_links, contact_email, logo_data, cover_data, template_id,
        brand_primary, brand_accent, identity_accepted_at, policies_accepted_at, page_visible, updated_at
      ) values (
        ${context.userId}, ${profile.employerType}, ${profile.displayName}, ${profile.slug}, ${profile.headline},
        ${profile.description}, ${profile.industry}, ${profile.city}, ${profile.region}, ${profile.phone},
        ${profile.website}, ${profile.socialLinks}, ${profile.contactEmail}, ${logo}, ${cover}, ${profile.templateId},
        ${profile.brandPrimary}, ${profile.brandAccent},
        ${profile.acceptIdentity ? new Date().toISOString() : null},
        ${profile.acceptPolicies ? new Date().toISOString() : null},
        ${profile.pageVisible}, now()
      )
      on conflict (user_id) do update set
        employer_type = excluded.employer_type,
        display_name = excluded.display_name,
        slug = excluded.slug,
        headline = excluded.headline,
        description = excluded.description,
        industry = excluded.industry,
        city = excluded.city,
        region = excluded.region,
        phone = excluded.phone,
        website = excluded.website,
        social_links = excluded.social_links,
        contact_email = excluded.contact_email,
        logo_data = excluded.logo_data,
        cover_data = excluded.cover_data,
        template_id = excluded.template_id,
        brand_primary = excluded.brand_primary,
        brand_accent = excluded.brand_accent,
        identity_accepted_at = case when ${profile.acceptIdentity} then coalesce(employer_profiles.identity_accepted_at, now()) else null end,
        policies_accepted_at = case when ${profile.acceptPolicies} then coalesce(employer_profiles.policies_accepted_at, now()) else null end,
        page_visible = excluded.page_visible,
        updated_at = now()
    `;
    await audit(sql, context.userId, "profile.save", "employer", context.userId);
    return { ok: true as const };
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<JobRow & { application_count: number }>`
      select j.*, (select count(*) from applications a where a.job_id = j.id) as application_count
      from jobs j where j.user_id = ${context.userId}
      order by j.updated_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      location: row.location,
      workMode: row.work_mode,
      updatedAt: stamp(row.updated_at),
      applicationCount: Number(row.application_count),
      caution: (JSON.parse(row.caution_flags || "[]") as string[]).length > 0,
    }));
  });

export const getJobEditor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const who = await actor(sql, context.userId);
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Create your employer profile before adding a role.");
    if (data.id === "new") {
      return {
        job: {
          ...cleanJob({
            title: "",
            slug: "",
            category: "",
            description: "",
            responsibilities: "",
            qualifications: "",
            skillsRequired: "",
            skillsPreferred: "",
            experience: "",
            employmentType: "Full-time",
            location: profile.city,
            workMode: "On-site",
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: "INR",
            salaryVisibility: "undisclosed",
            workingHours: "",
            vacancies: 1,
            deadline: "",
            contactEmail: profile.contactEmail || who.email,
            contactPhone: profile.phone,
            minAge: null,
            formMode: "standard",
            standardFields: normaliseStandardFields(undefined),
            questions: [],
          }),
        },
        status: "draft" as JobStatus,
        applicationCount: 0,
        emailVerified: who.emailVerified,
        suspended: profile.suspended,
        profile,
      };
    }
    const rows = await sql<JobRow>`select * from jobs where id = ${data.id} and user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) fail("That role was not found.");
    const questions = await questionsFor(sql, row.id);
    const counts = await sql<{ count: number }>`select count(*) as count from applications where job_id = ${row.id}`;
    return {
      job: jobInputFrom(row, questions),
      status: row.status,
      applicationCount: Number(counts[0]?.count ?? 0),
      emailVerified: who.emailVerified,
      suspended: profile.suspended,
      profile,
      caution: JSON.parse(row.caution_flags || "[]") as string[],
    };
  });

async function writeQuestions(sql: Sql, jobId: string, userId: string, questions: QuestionInput[]) {
  await sql`delete from application_questions where job_id = ${jobId} and user_id = ${userId}`;
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    await sql`
      insert into application_questions (
        id, job_id, user_id, sort_order, field_type, label, help_text, required, options_json, maps_to
      ) values (
        ${question.id}, ${jobId}, ${userId}, ${index}, ${question.type}, ${question.label}, ${question.help},
        ${question.required}, ${JSON.stringify(question.options)}, ${question.mapsTo}
      )
    `;
  }
}

export const saveJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: JobInput) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const who = await actor(sql, context.userId);
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Create your employer profile first.");
    const job = cleanJob(data);
    const existing = data.id
      ? (
          await sql<JobRow>`select * from jobs where id = ${data.id} and user_id = ${context.userId}`
        )[0]
      : undefined;
    if (data.id && !existing) fail("That role was not found.");
    const mode = existing && existing.status === "published" ? "publish" : "draft";
    const issues = jobIssues(job, mode);
    if (mode === "publish") {
      issues.push(
        ...publishBlockers({
          emailVerified: who.emailVerified,
          suspended: profile.suspended,
          profile,
          job,
        }).filter((issue) => !issues.includes(issue)),
      );
    }
    if (issues.length) fail(issues.join(" "));
    const slugTaken = await sql<{ id: string }>`
      select id from jobs where user_id = ${context.userId} and slug = ${job.slug} and id <> ${existing?.id ?? ""}
    `;
    if (slugTaken[0]) fail("You already have a role with that link.");
    const flags = fraudSignals(
      [job.title, job.description, job.responsibilities, job.qualifications, job.workingHours].join("\n"),
    );
    const id = existing?.id ?? crypto.randomUUID();
    if (!existing) {
      await sql`
        insert into jobs (
          id, user_id, title, slug, status, category, description, responsibilities, qualifications,
          skills_required, skills_preferred, experience, employment_type, location, work_mode,
          salary_min, salary_max, salary_currency, salary_visibility, working_hours, vacancies, deadline,
          contact_email, contact_phone, min_age, form_mode, standard_fields, caution_flags
        ) values (
          ${id}, ${context.userId}, ${job.title || "Untitled role"}, ${job.slug || `draft-${id.slice(0, 8)}`}, 'draft',
          ${job.category}, ${job.description}, ${job.responsibilities}, ${job.qualifications},
          ${job.skillsRequired}, ${job.skillsPreferred}, ${job.experience}, ${job.employmentType}, ${job.location},
          ${job.workMode}, ${job.salaryMin}, ${job.salaryMax}, ${job.salaryCurrency}, ${job.salaryVisibility},
          ${job.workingHours}, ${job.vacancies}, ${job.deadline || null}, ${job.contactEmail}, ${job.contactPhone},
          ${job.minAge}, ${job.formMode}, ${JSON.stringify(job.standardFields)}, ${JSON.stringify(flags)}
        )
      `;
    } else {
      await sql`
        update jobs set
          title = ${job.title}, slug = ${job.slug}, category = ${job.category}, description = ${job.description},
          responsibilities = ${job.responsibilities}, qualifications = ${job.qualifications},
          skills_required = ${job.skillsRequired}, skills_preferred = ${job.skillsPreferred},
          experience = ${job.experience}, employment_type = ${job.employmentType}, location = ${job.location},
          work_mode = ${job.workMode}, salary_min = ${job.salaryMin}, salary_max = ${job.salaryMax},
          salary_currency = ${job.salaryCurrency}, salary_visibility = ${job.salaryVisibility},
          working_hours = ${job.workingHours}, vacancies = ${job.vacancies}, deadline = ${job.deadline || null},
          contact_email = ${job.contactEmail}, contact_phone = ${job.contactPhone}, min_age = ${job.minAge},
          form_mode = ${job.formMode}, standard_fields = ${JSON.stringify(job.standardFields)},
          caution_flags = ${JSON.stringify(flags)}, updated_at = now()
        where id = ${id} and user_id = ${context.userId}
      `;
    }
    await writeQuestions(sql, id, context.userId, job.questions);
    await audit(sql, context.userId, "job.save", "job", id);
    return { id, warnings: flags };
  });

export const setJobStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; status: JobStatus }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    if (!isJobStatus(data.status)) fail("Unknown status.");
    const who = await actor(sql, context.userId);
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Create your employer profile first.");
    const rows = await sql<JobRow>`select * from jobs where id = ${data.id} and user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) fail("That role was not found.");
    let next = data.status;
    if (row.status === "archived" && next === "published") next = "draft";
    if (next === "published") {
      const job = jobInputFrom(row, await questionsFor(sql, row.id));
      const issues = publishBlockers({
        emailVerified: who.emailVerified,
        suspended: profile.suspended,
        profile,
        job,
      });
      if (issues.length) fail(issues.join(" "));
      await sql`
        update jobs set status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
        where id = ${row.id} and user_id = ${context.userId}
      `;
    } else {
      const allowed: Record<JobStatus, JobStatus[]> = {
        draft: ["archived"],
        published: ["paused", "closed", "archived"],
        paused: ["published", "closed", "archived"],
        closed: ["published", "archived"],
        archived: ["draft"],
      };
      if (!allowed[row.status].includes(next) && next !== row.status) {
        fail("That status change is not available.");
      }
      await sql`
        update jobs set status = ${next}, updated_at = now()
        where id = ${row.id} and user_id = ${context.userId}
      `;
    }
    await audit(sql, context.userId, `job.${next}`, "job", row.id);
    return { status: next };
  });

export const duplicateJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql<JobRow>`select * from jobs where id = ${data.id} and user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) fail("That role was not found.");
    const questions = await questionsFor(sql, row.id);
    const id = crypto.randomUUID();
    let slug = slugify(`${row.slug}-copy`);
    const taken = await sql<{ slug: string }>`select slug from jobs where user_id = ${context.userId} and slug like ${`${slug}%`}`;
    if (taken.some((item) => item.slug === slug)) slug = slugify(`${slug}-${id.slice(0, 4)}`);
    await sql`
      insert into jobs (
        id, user_id, title, slug, status, category, description, responsibilities, qualifications,
        skills_required, skills_preferred, experience, employment_type, location, work_mode,
        salary_min, salary_max, salary_currency, salary_visibility, working_hours, vacancies, deadline,
        contact_email, contact_phone, min_age, form_mode, standard_fields, caution_flags
      ) values (
        ${id}, ${context.userId}, ${row.title}, ${slug}, 'draft', ${row.category}, ${row.description},
        ${row.responsibilities}, ${row.qualifications}, ${row.skills_required}, ${row.skills_preferred},
        ${row.experience}, ${row.employment_type}, ${row.location}, ${row.work_mode}, ${row.salary_min},
        ${row.salary_max}, ${row.salary_currency}, ${row.salary_visibility}, ${row.working_hours},
        ${row.vacancies}, ${row.deadline}, ${row.contact_email}, ${row.contact_phone}, ${row.min_age},
        ${row.form_mode}, ${row.standard_fields}, ${row.caution_flags}
      )
    `;
    await writeQuestions(
      sql,
      id,
      context.userId,
      questions.map((question) => ({ ...question, id: crypto.randomUUID() })),
    );
    return { id };
  });

export const deleteDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql<{ status: string }>`
      select status from jobs where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!rows[0]) fail("That role was not found.");
    if (rows[0].status !== "draft") fail("Only drafts can be deleted. Archive a live role instead.");
    const apps = await sql<{ count: number }>`select count(*) as count from applications where job_id = ${data.id}`;
    if (Number(apps[0]?.count ?? 0) > 0) fail("This draft already has applications, so it cannot be deleted.");
    await sql`delete from jobs where id = ${data.id} and user_id = ${context.userId} and status = 'draft'`;
    return { ok: true as const };
  });

export const listApplicants = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { q?: string; jobId?: string; stage?: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const q = clip(data.q, 80);
    const stage = data.stage && isStage(data.stage) ? data.stage : "";
    const jobId = clip(data.jobId, 80);
    const pattern = likeContains(q.toLowerCase());
    const rows = await sql<{
      id: string;
      applicant_name: string;
      email: string;
      phone: string;
      city: string;
      title: string;
      job_id: string;
      stage: Stage;
      created_at: string;
      skills: string;
    }>`
      select a.id, a.applicant_name, a.email, a.phone, a.city, j.title, a.job_id, a.stage, a.created_at, a.skills
      from applications a join jobs j on j.id = a.job_id
      where a.employer_user_id = ${context.userId}
        and (${q} = '' or a.search_text ilike ${pattern} escape '\\')
        and (${stage} = '' or a.stage = ${stage})
        and (${jobId} = '' or a.job_id = ${jobId})
      order by a.created_at desc
      limit 200
    `;
    const jobs = await sql<{ id: string; title: string }>`
      select id, title from jobs where user_id = ${context.userId} order by title
    `;
    return {
      jobs,
      rows: rows.map((row) => ({
        id: row.id,
        name: row.applicant_name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        jobTitle: row.title,
        jobId: row.job_id,
        stage: row.stage,
        createdAt: stamp(row.created_at),
        skills: row.skills,
      })),
    };
  });

type StoredAnswer = {
  questionId: string;
  label: string;
  value: string;
  fileName?: string;
  fileMime?: string;
  fileData?: string;
};

export const getApplicant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      job_id: string;
      applicant_name: string;
      email: string;
      phone: string;
      city: string;
      education: string;
      experience: string;
      skills: string;
      stage: Stage;
      cv_filename: string;
      cv_mime: string;
      cv_source: string;
      answers_json: string;
      created_at: string;
      consent_at: string;
      privacy_version: string;
      age_confirmed: boolean;
      source: string;
      utm_source: string;
      rating_skill: number | null;
      rating_experience: number | null;
      rating_communication: number | null;
      title: string;
    }>`
      select a.id, a.job_id, a.applicant_name, a.email, a.phone, a.city, a.education, a.experience, a.skills,
        a.stage, a.cv_filename, a.cv_mime, a.cv_source, a.answers_json, a.created_at, a.consent_at,
        a.privacy_version, a.age_confirmed, a.source, a.utm_source, a.rating_skill, a.rating_experience,
        a.rating_communication, j.title
      from applications a join jobs j on j.id = a.job_id
      where a.id = ${data.id} and a.employer_user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) fail("That application was not found.");
    const answers = (JSON.parse(row.answers_json || "[]") as StoredAnswer[]).map((answer) => ({
      questionId: answer.questionId,
      label: answer.label,
      value: answer.fileData ? "" : answer.value,
      fileName: answer.fileName ?? "",
      hasFile: Boolean(answer.fileData),
    }));
    const notes = await sql<{ id: string; body: string; created_at: string }>`
      select id, body, created_at from employer_notes
      where application_id = ${row.id} and employer_user_id = ${context.userId}
      order by created_at desc
    `;
    const history = await sql<{ from_stage: string; to_stage: string; created_at: string }>`
      select from_stage, to_stage, created_at from application_stage_history
      where application_id = ${row.id} and employer_user_id = ${context.userId}
      order by created_at desc
    `;
    return {
      id: row.id,
      jobId: row.job_id,
      jobTitle: row.title,
      name: row.applicant_name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      education: row.education,
      experience: row.experience,
      skills: row.skills,
      stage: row.stage,
      cvName: row.cv_filename,
      cvMime: row.cv_mime,
      cvSource: row.cv_source,
      hasCv: Boolean(row.cv_filename),
      answers,
      createdAt: stamp(row.created_at),
      consentAt: stamp(row.consent_at),
      privacyVersion: row.privacy_version,
      ageConfirmed: row.age_confirmed,
      source: row.source,
      utmSource: row.utm_source,
      ratings: {
        skill: row.rating_skill,
        experience: row.rating_experience,
        communication: row.rating_communication,
      },
      notes: notes.map((note) => ({ id: note.id, body: note.body, createdAt: stamp(note.created_at) })),
      history: history.map((item) => ({
        from: item.from_stage,
        to: item.to_stage,
        createdAt: stamp(item.created_at),
      })),
    };
  });

export const setStage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; stage: Stage }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    if (!isStage(data.stage)) fail("Unknown stage.");
    const rows = await sql<{ stage: Stage }>`
      select stage from applications where id = ${data.id} and employer_user_id = ${context.userId}
    `;
    const current = rows[0];
    if (!current) fail("That application was not found.");
    if (current.stage === data.stage) return { stage: data.stage };
    await sql`
      update applications set stage = ${data.stage}, updated_at = now()
      where id = ${data.id} and employer_user_id = ${context.userId}
    `;
    await sql`
      insert into application_stage_history (id, application_id, employer_user_id, from_stage, to_stage)
      values (${crypto.randomUUID()}, ${data.id}, ${context.userId}, ${current.stage}, ${data.stage})
    `;
    await audit(sql, context.userId, "application.stage", "application", data.id, data.stage);
    return { stage: data.stage };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; body: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const body = clip(data.body, 4000);
    if (body.length < 2) fail("Write a note first.");
    const rows = await sql<{ id: string }>`
      select id from applications where id = ${data.id} and employer_user_id = ${context.userId}
    `;
    if (!rows[0]) fail("That application was not found.");
    await sql`
      insert into employer_notes (id, application_id, employer_user_id, body)
      values (${crypto.randomUUID()}, ${data.id}, ${context.userId}, ${body})
    `;
    return { ok: true as const };
  });

export const setRatings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; skill: number | null; experience: number | null; communication: number | null }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const score = (value: number | null) => {
      if (value == null) return null;
      const n = Math.round(Number(value));
      if (n < 1 || n > 5) fail("Ratings are from 1 to 5.");
      return n;
    };
    const skill = score(data.skill);
    const experience = score(data.experience);
    const communication = score(data.communication);
    const updated = await sql<{ id: string }>`
      update applications set rating_skill = ${skill}, rating_experience = ${experience},
        rating_communication = ${communication}, updated_at = now()
      where id = ${data.id} and employer_user_id = ${context.userId}
      returning id
    `;
    if (!updated[0]) fail("That application was not found.");
    return { ok: true as const };
  });

export const exportApplicants = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { jobId?: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const jobId = clip(data.jobId, 80);
    const rows = await sql<{
      applicant_name: string;
      email: string;
      phone: string;
      city: string;
      title: string;
      stage: string;
      created_at: string;
      education: string;
      experience: string;
      skills: string;
    }>`
      select a.applicant_name, a.email, a.phone, a.city, j.title, a.stage, a.created_at, a.education, a.experience, a.skills
      from applications a join jobs j on j.id = a.job_id
      where a.employer_user_id = ${context.userId} and (${jobId} = '' or a.job_id = ${jobId})
      order by a.created_at desc
      limit 5000
    `;
    const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const header = ["Name", "Email", "Mobile", "City", "Role", "Stage", "Applied", "Education", "Experience", "Skills"];
    const lines = rows.map((row) =>
      [
        row.applicant_name,
        row.email,
        row.phone,
        row.city,
        row.title,
        row.stage,
        stamp(row.created_at),
        row.education,
        row.experience,
        row.skills,
      ]
        .map((value) => cell(String(value ?? "")))
        .join(","),
    );
    await audit(sql, context.userId, "application.export", "employer", context.userId, String(rows.length));
    return { filename: "brandvika-applicants.csv", csv: `\uFEFF${header.join(",")}\n${lines.join("\n")}` };
  });

export const downloadPrivateFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { kind: "cv" | "answer" | "evidence"; id: string; questionId?: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const who = await actor(sql, context.userId);
    if (data.kind === "evidence") {
      const rows = await sql<{ document_name: string; document_mime: string; document_data: string; user_id: string }>`
        select document_name, document_mime, document_data, user_id from verification_requests where id = ${data.id}
      `;
      const row = rows[0];
      if (!row || (row.user_id !== context.userId && !who.isAdmin)) fail("That document was not found.");
      return { name: row.document_name, mime: row.document_mime, dataBase64: row.document_data };
    }
    const rows = await sql<{ cv_filename: string; cv_mime: string; cv_data: string; answers_json: string }>`
      select cv_filename, cv_mime, cv_data, answers_json from applications
      where id = ${data.id} and (employer_user_id = ${context.userId} or ${who.isAdmin} = true)
    `;
    const row = rows[0];
    if (!row) fail("That file was not found.");
    if (data.kind === "cv") {
      if (!row.cv_data) fail("No CV was attached.");
      return { name: row.cv_filename || "cv.pdf", mime: row.cv_mime || "application/pdf", dataBase64: row.cv_data };
    }
    const answers = JSON.parse(row.answers_json || "[]") as StoredAnswer[];
    const answer = answers.find((item) => item.questionId === data.questionId && item.fileData);
    if (!answer?.fileData) fail("That file was not found.");
    return { name: answer.fileName || "attachment", mime: answer.fileMime || "application/octet-stream", dataBase64: answer.fileData };
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { legalName: string; documentLabel: string; note: string; file: FilePayload | null }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Create your employer profile first.");
    if (profile.employerType !== "business") {
      fail("Business verification is for business profiles. Individuals keep the basic check only.");
    }
    const legalName = clip(data.legalName, 160);
    if (legalName.length < 2) fail("Add the business name you want reviewed.");
    if (!data.file) fail("Attach a document. It stays private.");
    const file = inspectEvidence(data.file);
    if (!file.ok) fail(file.error);
    await sql`
      insert into verification_requests (
        id, user_id, status, legal_name, document_label, document_name, document_mime, document_data, note
      ) values (
        ${crypto.randomUUID()}, ${context.userId}, 'pending', ${legalName}, ${clip(data.documentLabel, 80)},
        ${file.name}, ${file.mime}, ${bytesToBase64(file.bytes)}, ${clip(data.note, 2000)}
      )
    `;
    await audit(sql, context.userId, "verification.submit", "employer", context.userId);
    return { status: "pending" as const };
  });

export const listVerification = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      status: string;
      legal_name: string;
      document_label: string;
      document_name: string;
      reviewer_note: string;
      created_at: string;
    }>`
      select id, status, legal_name, document_label, document_name, reviewer_note, created_at
      from verification_requests where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      legalName: row.legal_name,
      documentLabel: row.document_label,
      documentName: row.document_name,
      reviewerNote: row.reviewer_note,
      createdAt: stamp(row.created_at),
    }));
  });

function publicEmployerFrom(
  row: ProfileRow,
  emailVerified: boolean,
  businessStatus: string | null,
): PublicEmployer {
  const profile = toProfile(row);
  return {
    displayName: profile.displayName,
    employerType: profile.employerType,
    slug: profile.slug,
    headline: profile.headline,
    description: profile.description,
    industry: profile.industry,
    city: profile.city,
    region: profile.region,
    phone: profile.phone,
    website: profile.website,
    socialLinks: profile.socialLinks,
    contactEmail: profile.contactEmail,
    logoData: profile.logoData,
    coverData: profile.coverData,
    templateId: profile.templateId,
    brandPrimary: profile.brandPrimary,
    brandAccent: profile.brandAccent,
    basicReady:
      basicGaps({
        emailVerified,
        phone: profile.phone,
        identityAccepted: profile.acceptIdentity,
        policiesAccepted: profile.acceptPolicies,
      }).length === 0,
    businessApproved: businessStatus === "approved",
  };
}

function toPublicJob(row: JobRow, questions: PublicQuestion[]): PublicJob {
  const deadline = row.deadline ? String(row.deadline).slice(0, 10) : null;
  const open = row.status === "published" && (!deadline || deadline >= todayInIndia());
  return {
    title: row.title,
    slug: row.slug,
    category: row.category,
    description: row.description,
    responsibilities: row.responsibilities,
    qualifications: row.qualifications,
    skillsRequired: row.skills_required,
    skillsPreferred: row.skills_preferred,
    experience: row.experience,
    employmentType: row.employment_type,
    location: row.location,
    workMode: row.work_mode,
    salaryLabel: salaryLabel({
      visibility: row.salary_visibility,
      min: row.salary_min,
      max: row.salary_max,
      currency: row.salary_currency,
    }),
    workingHours: row.working_hours,
    vacancies: Number(row.vacancies),
    deadline,
    accepting: open,
    minAge: row.min_age == null ? null : Number(row.min_age),
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    formMode: row.form_mode,
    standardFields: normaliseStandardFields(JSON.parse(row.standard_fields || "{}") as StandardFields),
    questions,
  };
}

export const publicBoard = createServerFn({ method: "POST" })
  .validator((data: { employerSlug: string; jobSlug?: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const slug = slugify(data.employerSlug);
    const profiles = await sql<ProfileRow>`
      select * from employer_profiles where slug = ${slug} and page_visible = true and suspended_at is null
    `;
    const profile = profiles[0];
    if (!profile) return { found: false as const };
    const who = await actor(sql, profile.user_id);
    const latest = await sql<{ status: string }>`
      select status from verification_requests where user_id = ${profile.user_id} order by created_at desc limit 1
    `;
    const employer = publicEmployerFrom(profile, who.emailVerified, latest[0]?.status ?? null);
    const jobs = await sql<JobRow>`
      select * from jobs
      where user_id = ${profile.user_id} and status in ('published', 'paused', 'closed')
      order by published_at desc nulls last, created_at desc
    `;
    const cards = jobs.map((row) => ({
      title: row.title,
      slug: row.slug,
      location: row.location,
      workMode: row.work_mode,
      employmentType: row.employment_type,
      accepting: row.status === "published" && (!row.deadline || String(row.deadline).slice(0, 10) >= todayInIndia()),
      status: row.status,
    }));
    if (!data.jobSlug) return { found: true as const, employer, jobs: cards, job: null };
    const row = jobs.find((item) => item.slug === slugify(data.jobSlug ?? ""));
    if (!row) return { found: false as const };
    const questions = await questionsFor(sql, row.id);
    return { found: true as const, employer, jobs: cards, job: toPublicJob(row, questions) };
  });

async function checkTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return;
  if (!token) fail("The spam check did not complete.");
  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const json = (await response.json()) as { success?: boolean };
  if (!json.success) fail("The spam check failed.");
}

export const submitApplication = createServerFn({ method: "POST" })
  .validator((data: ApplicationInput & { turnstileToken?: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const ip = await clientIp();
    const employerSlug = slugify(data.employerSlug);
    const jobSlug = slugify(data.jobSlug);
    const profiles = await sql<ProfileRow>`
      select * from employer_profiles where slug = ${employerSlug} and page_visible = true and suspended_at is null
    `;
    const profile = profiles[0];
    if (!profile) fail("This hiring page is not available.");
    const jobs = await sql<JobRow>`
      select * from jobs where user_id = ${profile.user_id} and slug = ${jobSlug}
    `;
    const row = jobs[0];
    if (!row || !["published", "paused", "closed"].includes(row.status)) fail("This role is not available.");
    const questions = await questionsFor(sql, row.id);
    const job = toPublicJob(row, questions);
    if (!(await bumpLimit(sql, `apply-job:${row.id}:${todayInIndia()}`, 80, 24 * 60))) {
      fail("This page is receiving a lot of applications. Try again later.");
    }
    if (ip && !(await bumpLimit(sql, `apply-ip:${ip}:${todayInIndia()}`, 25, 24 * 60))) {
      fail("Too many applications were sent from this network today.");
    }
    await checkTurnstile(data.turnstileToken ?? "");
    const issues = validateApplication(job, data);
    if (issues.length) fail(issues.join(" "));
    const name = resolvedName(job, data);
    const email = resolvedEmail(job, data);
    const phone = resolvedPhone(job, data);
    const emailNorm = email ? normaliseEmail(email) : "";
    const phoneNorm = phone ? normalisePhone(phone) : "";
    const contactBucket = `apply-who:${row.id}:${emailNorm || phoneNorm}`;
    if (!(await bumpLimit(sql, contactBucket, 4, 24 * 60))) fail(GENERIC_APPLY);
    const duplicate = await sql<{ id: string }>`
      select id from applications where job_id = ${row.id} and (
        (${emailNorm} <> '' and email_norm = ${emailNorm}) or (${phoneNorm} <> '' and phone_norm = ${phoneNorm})
      ) limit 1
    `;
    if (duplicate[0]) fail(GENERIC_APPLY);

    let cvName = "";
    let cvMime = "";
    let cvData = "";
    let cvSource: "" | "upload" | "builder" = "";
    if (data.cv?.dataBase64) {
      const inspected = inspectCv(data.cv);
      if (!inspected.ok) fail(inspected.error);
      cvName = inspected.name;
      cvMime = inspected.mime;
      cvData = bytesToBase64(inspected.bytes);
      cvSource = data.cvSource === "builder" ? "builder" : "upload";
    }
    const stored: StoredAnswer[] = [];
    let fileCount = data.cv?.dataBase64 ? 1 : 0;
    if (job.formMode === "custom") {
      for (const question of job.questions) {
        if (question.type === "file") {
          const file = data.files?.find((item) => item.questionId === question.id);
          if (!file) {
            stored.push({ questionId: question.id, label: question.label, value: "" });
            continue;
          }
          fileCount += 1;
          if (fileCount > 3) fail("Too many files were attached.");
          const inspected = inspectCv(file.file);
          const evidence = inspected.ok ? null : inspectEvidence(file.file);
          const picked = inspected.ok ? inspected : evidence && evidence.ok ? evidence : null;
          if (!picked) fail(inspected.ok ? "File rejected." : inspected.error);
          stored.push({
            questionId: question.id,
            label: question.label,
            value: picked.name,
            fileName: picked.name,
            fileMime: picked.mime,
            fileData: bytesToBase64(picked.bytes),
          });
        } else {
          const answer = data.answers?.find((item) => item.questionId === question.id);
          stored.push({ questionId: question.id, label: question.label, value: clip(answer?.value, 5000) });
        }
      }
    }
    const id = crypto.randomUUID();
    const token = randomToken();
    const tokenHash = await sha256(token);
    const city = resolvedCity(job, data);
    const education = clip(data.education, 2000);
    const experience = clip(data.experience, 4000);
    const skills = clip(data.skills, 2000);
    const search = [name, email, phone, city, education, experience, skills, ...stored.map((item) => item.value)]
      .join(" ")
      .toLowerCase()
      .slice(0, 8000);
    try {
      await sql`
        insert into applications (
          id, job_id, employer_user_id, applicant_name, email, email_norm, phone, phone_norm, city,
          education, experience, skills, cv_filename, cv_mime, cv_data, cv_source, answers_json, search_text,
          consent_at, privacy_version, age_confirmed, manage_token_hash, source, utm_source, utm_medium, utm_campaign
        ) values (
          ${id}, ${row.id}, ${profile.user_id}, ${name}, ${email}, ${emailNorm}, ${phone}, ${phoneNorm}, ${city},
          ${education}, ${experience}, ${skills}, ${cvName}, ${cvMime}, ${cvData}, ${cvSource},
          ${JSON.stringify(stored)}, ${search}, now(), ${operator.noticeVersion}, ${Boolean(data.ageConfirmed)},
          ${tokenHash}, ${clip(data.source || "direct", 40)}, ${clip(data.utmSource, 80)},
          ${clip(data.utmMedium, 80)}, ${clip(data.utmCampaign, 80)}
        )
      `;
    } catch (error) {
      if (isUnique(error)) fail(GENERIC_APPLY);
      throw error;
    }
    for (const answer of stored) {
      await sql`
        insert into application_answers (id, application_id, employer_user_id, question_key, label, value_text)
        values (${crypto.randomUUID()}, ${id}, ${profile.user_id}, ${answer.questionId}, ${answer.label}, ${answer.fileData ? answer.fileName ?? "" : answer.value})
      `;
    }
    await sql`
      insert into consent_records (id, application_id, notice_version, purpose)
      values (${crypto.randomUUID()}, ${id}, ${operator.noticeVersion}, ${"application"})
    `;
    await sql`
      insert into application_stage_history (id, application_id, employer_user_id, from_stage, to_stage)
      values (${crypto.randomUUID()}, ${id}, ${profile.user_id}, ${"none"}, ${"applied"})
    `;
    const mail = email
      ? await sendMail({
          to: email,
          subject: `Application received — ${row.title}`,
          text: `Your application to ${profile.display_name} for ${row.title} was recorded. Reference ${id.slice(0, 8).toUpperCase()}.`,
        })
      : { delivered: false as const, reason: "No email address was provided, so no receipt was sent." };
    await audit(sql, "", "application.create", "application", id, mail.delivered ? "mail-sent" : "mail-not-sent");
    return {
      reference: id.slice(0, 8).toUpperCase(),
      managePath: `/m/${token}`,
      mail,
    };
  });

export const manageApplication = createServerFn({ method: "POST" })
  .validator((data: { token: string; withdraw?: boolean }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const token = clip(data.token, 80);
    if (token.length < 32) fail("This link is not valid.");
    if (!(await bumpLimit(sql, `manage:${token.slice(0, 12)}`, 20, 60))) fail("Try again later.");
    const hash = await sha256(token);
    const rows = await sql<{
      id: string;
      stage: Stage;
      applicant_name: string;
      created_at: string;
      title: string;
      display_name: string;
    }>`
      select a.id, a.stage, a.applicant_name, a.created_at, j.title, p.display_name
      from applications a
      join jobs j on j.id = a.job_id
      join employer_profiles p on p.user_id = a.employer_user_id
      where a.manage_token_hash = ${hash}
    `;
    const row = rows[0];
    if (!row) fail("This link is not valid.");
    if (data.withdraw && row.stage !== "withdrawn") {
      await sql`update applications set stage = 'withdrawn', updated_at = now() where id = ${row.id}`;
      await sql`
        insert into application_stage_history (id, application_id, employer_user_id, from_stage, to_stage)
        select ${crypto.randomUUID()}, id, employer_user_id, ${row.stage}, 'withdrawn' from applications where id = ${row.id}
      `;
      await audit(sql, "", "application.withdraw", "application", row.id);
    }
    return {
      name: row.applicant_name,
      jobTitle: row.title,
      employerName: row.display_name,
      stage: data.withdraw ? "withdrawn" : row.stage,
      createdAt: stamp(row.created_at),
    };
  });

export const submitReport = createServerFn({ method: "POST" })
  .validator((data: { kind: "job" | "employer" | "abuse"; employerSlug: string; jobSlug: string; email: string; details: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const details = clip(data.details, 4000);
    if (details.length < 10) fail("Describe the problem in a sentence or two.");
    const email = clip(data.email, 160);
    if (email && !isValidEmail(email)) fail("Email looks invalid.");
    const kind = data.kind === "employer" || data.kind === "abuse" ? data.kind : "job";
    if (!(await bumpLimit(sql, `report:${normaliseEmail(email) || (await clientIp()) || "anon"}`, 8, 24 * 60))) {
      fail("Too many reports were sent. Try again tomorrow.");
    }
    const id = crypto.randomUUID();
    await sql`
      insert into platform_reports (id, kind, employer_slug, job_slug, reporter_email, details)
      values (${id}, ${kind}, ${slugify(data.employerSlug)}, ${slugify(data.jobSlug)}, ${email}, ${details})
    `;
    await audit(sql, "", "report.create", "report", id, kind);
    return { reference: id.slice(0, 8).toUpperCase() };
  });

export const submitPrivacy = createServerFn({ method: "POST" })
  .validator((data: { kind: "access" | "correction" | "deletion" | "complaint"; email: string; details: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const email = clip(data.email, 160);
    const details = clip(data.details, 4000);
    if (!isValidEmail(email)) fail("Add a valid email so the request can be answered.");
    if (details.length < 10) fail("Describe the request.");
    const kind = ["access", "correction", "deletion", "complaint"].includes(data.kind) ? data.kind : "access";
    if (!(await bumpLimit(sql, `privacy:${normaliseEmail(email)}`, 6, 24 * 60))) fail("Too many requests from this email today.");
    const id = crypto.randomUUID();
    const reference = `BV-${id.slice(0, 8).toUpperCase()}`;
    await sql`
      insert into privacy_requests (id, kind, email, details, reference_code)
      values (${id}, ${kind}, ${email}, ${details}, ${reference})
    `;
    await audit(sql, "", "privacy.request", "privacy", id, kind);
    return { reference };
  });

export const submitContact = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; message: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const name = clip(data.name, 120);
    const email = clip(data.email, 160);
    const message = clip(data.message, 4000);
    if (name.length < 2) fail("Add your name.");
    if (!isValidEmail(email)) fail("Email looks invalid.");
    if (message.length < 10) fail("Write a short message.");
    if (!(await bumpLimit(sql, `contact:${normaliseEmail(email)}`, 5, 24 * 60))) fail("Too many messages today.");
    await sql`
      insert into inquiries (id, name, email, message) values (${crypto.randomUUID()}, ${name}, ${email}, ${message})
    `;
    return { ok: true as const };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const verifications = await sql<{
      id: string;
      status: string;
      legal_name: string;
      display_name: string;
      created_at: string;
      user_id: string;
    }>`
      select v.id, v.status, v.legal_name, p.display_name, v.created_at, v.user_id
      from verification_requests v join employer_profiles p on p.user_id = v.user_id
      order by v.created_at desc limit 40
    `;
    const reports = await sql<{
      id: string;
      kind: string;
      employer_slug: string;
      job_slug: string;
      details: string;
      status: string;
      created_at: string;
    }>`
      select id, kind, employer_slug, job_slug, details, status, created_at
      from platform_reports order by created_at desc limit 40
    `;
    const flagged = await sql<{ id: string; title: string; slug: string; employer_slug: string; caution_flags: string }>`
      select j.id, j.title, j.slug, p.slug as employer_slug, j.caution_flags
      from jobs j join employer_profiles p on p.user_id = j.user_id
      where j.caution_flags not in ('', '[]') and j.status = 'published'
      order by j.updated_at desc limit 20
    `;
    const privacy = await sql<{ id: string; kind: string; email: string; status: string; reference_code: string; created_at: string }>`
      select id, kind, email, status, reference_code, created_at from privacy_requests order by created_at desc limit 20
    `;
    return {
      verifications: verifications.map((row) => ({
        id: row.id,
        status: row.status,
        legalName: row.legal_name,
        displayName: row.display_name,
        userId: row.user_id,
        createdAt: stamp(row.created_at),
      })),
      reports: reports.map((row) => ({
        id: row.id,
        kind: row.kind,
        employerSlug: row.employer_slug,
        jobSlug: row.job_slug,
        details: row.details,
        status: row.status,
        createdAt: stamp(row.created_at),
      })),
      flagged: flagged.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        employerSlug: row.employer_slug,
        flags: JSON.parse(row.caution_flags || "[]") as string[],
      })),
      privacy: privacy.map((row) => ({
        id: row.id,
        kind: row.kind,
        email: row.email,
        status: row.status,
        reference: row.reference_code,
        createdAt: stamp(row.created_at),
      })),
    };
  });

export const adminReviewVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; status: "approved" | "rejected" | "more_info" | "reverify"; note: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const status = data.status;
    if (!["approved", "rejected", "more_info", "reverify"].includes(status)) fail("Unknown decision.");
    const updated = await sql<{ id: string }>`
      update verification_requests set status = ${status}, reviewer_user_id = ${context.userId},
        reviewer_note = ${clip(data.note, 2000)}, updated_at = now()
      where id = ${data.id}
      returning id
    `;
    if (!updated[0]) fail("That request was not found.");
    await audit(sql, context.userId, `verification.${status}`, "verification", data.id);
    return { ok: true as const };
  });

export const adminSuspension = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; suspend: boolean; reason: string }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    if (data.userId === context.userId) fail("You cannot suspend your own operator account from here.");
    const reason = clip(data.reason, 500);
    const updated = await sql<{ user_id: string }>`
      update employer_profiles set
        suspended_at = ${data.suspend ? new Date().toISOString() : null},
        suspension_reason = ${data.suspend ? reason : ""},
        updated_at = now()
      where user_id = ${data.userId}
      returning user_id
    `;
    if (!updated[0]) fail("That employer was not found.");
    await audit(sql, context.userId, data.suspend ? "employer.suspend" : "employer.restore", "employer", data.userId);
    return { ok: true as const };
  });

export const adminJobStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; status: JobStatus }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    if (!isJobStatus(data.status) || (data.status !== "archived" && data.status !== "closed" && data.status !== "published")) {
      fail("Operators can close, archive, or republish a role.");
    }
    const updated = await sql<{ id: string }>`
      update jobs set status = ${data.status}, updated_at = now() where id = ${data.id} returning id
    `;
    if (!updated[0]) fail("That role was not found.");
    await audit(sql, context.userId, `moderation.${data.status}`, "job", data.id);
    return { ok: true as const };
  });

export const adminReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; status: "reviewing" | "resolved" | "dismissed" }) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const updated = await sql<{ id: string }>`
      update platform_reports set status = ${data.status} where id = ${data.id} returning id
    `;
    if (!updated[0]) fail("That report was not found.");
    await audit(sql, context.userId, `report.${data.status}`, "report", data.id);
    return { ok: true as const };
  });

export const makeQr = createServerFn({ method: "POST" })
  .validator((data: { text: string }) => data)
  .handler(async ({ data }) => {
    const text = clip(data.text, 500);
    if (!/^https?:\/\//i.test(text)) fail("Only web links can be turned into a code.");
    const qr = await import("qrcode");
    const url = await qr.toDataURL(text, { margin: 1, width: 280 });
    return { url };
  });

export const previewProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return { employer: null, jobs: [] as { title: string; slug: string }[] };
    const who = await actor(sql, context.userId);
    const latest = await sql<{ status: string }>`
      select status from verification_requests where user_id = ${context.userId} order by created_at desc limit 1
    `;
    const rows = await sql<ProfileRow>`select * from employer_profiles where user_id = ${context.userId}`;
    const jobs = await sql<{ title: string; slug: string; status: string }>`
      select title, slug, status from jobs where user_id = ${context.userId} and status = 'published' order by published_at desc limit 4
    `;
    return {
      employer: rows[0] ? publicEmployerFrom(rows[0], who.emailVerified, latest[0]?.status ?? null) : null,
      jobs: jobs.map((job) => ({ title: job.title, slug: job.slug })),
    };
  });

void isValidPhone;
void isValidEmail;
void SniffedKind;
