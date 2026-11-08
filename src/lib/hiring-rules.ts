import type {
  ApplicationInput,
  CvDocument,
  EmployerInput,
  FieldKey,
  FilePayload,
  JobInput,
  MapsTo,
  PublicQuestion,
  QuestionInput,
  QuestionType,
  SalaryVisibility,
  Stage,
  StandardFields,
  TemplateId,
} from "@/lib/types";
import {
  FIELD_KEYS,
  JOB_STATUSES,
  MAPS_TO,
  QUESTION_TYPES,
  SALARY_VISIBILITY,
  STAGES,
  TEMPLATE_IDS,
} from "@/lib/types";

export const NOTICE_VERSION = "2026-11-09-draft";

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
] as const;

export const WORK_MODES = ["On-site", "Hybrid", "Remote"] as const;

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview scheduled",
  interview_completed: "Interview completed",
  selected: "Selected",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "small-business": "Small business",
  corporate: "Corporate",
  "creative-gaming": "Creative / gaming",
  "cultural-festival": "Cultural / festival",
};

export const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Full name",
  email: "Email",
  phone: "Mobile number",
  city: "City",
  education: "Education",
  experience: "Work experience",
  skills: "Skills",
  cv: "CV",
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "brandvika",
  "desk",
  "hire",
  "legal",
  "login",
  "manage",
  "operator",
  "privacy",
  "support",
  "www",
]);

export function defaultStandardFields(): StandardFields {
  return {
    name: { enabled: true, required: true },
    email: { enabled: true, required: true },
    phone: { enabled: true, required: false },
    city: { enabled: true, required: false },
    education: { enabled: true, required: false },
    experience: { enabled: true, required: false },
    skills: { enabled: true, required: false },
    cv: { enabled: true, required: false },
  };
}

export function emptyJob(): JobInput {
  return {
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
    location: "",
    workMode: "On-site",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "INR",
    salaryVisibility: "undisclosed",
    workingHours: "",
    vacancies: 1,
    deadline: "",
    contactEmail: "",
    contactPhone: "",
    minAge: null,
    formMode: "standard",
    standardFields: defaultStandardFields(),
    questions: [],
  };
}

export function emptyCv(): CvDocument {
  return {
    style: "simple",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    education: [{ school: "", qualification: "", years: "" }],
    experience: [{ company: "", title: "", duration: "", details: "" }],
    technicalSkills: "",
    professionalSkills: "",
    languages: "",
    projects: [],
    certifications: [],
    internships: [],
    achievements: [],
  };
}

export function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug;
}

export function validateSlug(slug: string, label: string): string[] {
  if (slug.length < 3) return [`${label} must be at least 3 characters.`];
  if (slug.length > 60) return [`${label} must be 60 characters or fewer.`];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return [`${label} can use only lowercase letters, numbers, and hyphens.`];
  }
  if (RESERVED_SLUGS.has(slug)) return [`${label} is reserved.`];
  return [];
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

/** Accepts a 10-digit Indian mobile, optional leading 0 / +91, or a generic E.164 number. */
export function isValidPhone(value: string): boolean {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^(?:\+91|91|0)?[6-9]\d{9}$/.test(compact)) return true;
  return /^\+[1-9]\d{7,14}$/.test(compact);
}

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (/^(?:91)?[6-9]\d{9}$/.test(digits) && digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function inkOn(hex: string): string {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#17211D" : "#FFFCF8";
}

export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function salaryLabel(input: {
  visibility: SalaryVisibility;
  min: number | null;
  max: number | null;
  currency: string;
}): string {
  if (input.visibility === "undisclosed") return "Pay discussed later";
  if (input.visibility === "negotiable" && input.min == null && input.max == null) return "Negotiable";
  const currency = input.currency || "INR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (input.min != null && input.max != null) {
    const range = `${fmt(input.min)} – ${fmt(input.max)}`;
    return input.visibility === "negotiable" ? `${range}, negotiable` : range;
  }
  if (input.min != null) return `From ${fmt(input.min)}${input.visibility === "negotiable" ? ", negotiable" : ""}`;
  if (input.max != null) return `Up to ${fmt(input.max)}${input.visibility === "negotiable" ? ", negotiable" : ""}`;
  return "Negotiable";
}

const FRAUD_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "Application or training fee", re: /\b(registration|application|processing|training|security)\s+fee\b/i },
  { id: "Deposit or refundable charge", re: /\b(refundable\s+deposit|security\s+deposit|pay\s+a\s+deposit)\b/i },
  { id: "Payment to apply", re: /\b(pay\s+to\s+apply|send\s+money|payment\s+required|gpay|phonepe|paytm|upi\s+id)\b/i },
  { id: "Financial or OTP details", re: /\b(bank\s+account|ifsc|debit\s+card|credit\s+card|\bcvv\b|\botp\b)\b/i },
];

export function fraudSignals(text: string): string[] {
  return FRAUD_PATTERNS.filter((pattern) => pattern.re.test(text)).map((pattern) => pattern.id);
}

export function normaliseStandardFields(input: StandardFields | undefined): StandardFields {
  const base = defaultStandardFields();
  if (!input) return base;
  for (const key of FIELD_KEYS) {
    const rule = input[key];
    if (!rule) continue;
    base[key] = { enabled: key === "name" ? true : Boolean(rule.enabled), required: Boolean(rule.required) };
  }
  base.name.enabled = true;
  base.name.required = true;
  if (!base.email.enabled && !base.phone.enabled) {
    base.email.enabled = true;
    base.email.required = true;
  }
  if (base.email.enabled === false) base.email.required = false;
  if (base.phone.enabled === false) base.phone.required = false;
  if (!base.email.required && !base.phone.required) {
    if (base.email.enabled) base.email.required = true;
    else base.phone.required = true;
  }
  return base;
}

function cleanOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const option of options) {
    const label = clip(option, 80);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= 20) break;
  }
  return out;
}

export function normaliseQuestions(questions: QuestionInput[]): QuestionInput[] {
  return questions.slice(0, 25).map((question) => {
    const type = QUESTION_TYPES.includes(question.type) ? question.type : "short";
    const mapsTo = MAPS_TO.includes(question.mapsTo) ? question.mapsTo : "";
    const choice = type === "dropdown" || type === "single" || type === "multi";
    return {
      id: clip(question.id, 80) || crypto.randomUUID(),
      type,
      label: clip(question.label, 160),
      help: clip(question.help, 400),
      required: Boolean(question.required),
      options: choice ? cleanOptions(question.options ?? []) : [],
      mapsTo: type === "file" || type === "yesno" || type === "multi" ? "" : mapsTo,
    };
  });
}

export function jobIssues(job: JobInput, mode: "draft" | "publish"): string[] {
  const issues: string[] = [];
  const title = clip(job.title, 120);
  if (mode === "publish" && title.length < 3) issues.push("Add a job title.");
  const slug = slugify(job.slug || title);
  if (mode === "publish") issues.push(...validateSlug(slug, "Job link"));
  else if (clip(job.slug, 80)) issues.push(...validateSlug(slugify(job.slug), "Job link"));
  if (mode === "publish") {
    if (clip(job.description, 8000).length < 40) issues.push("Describe the role in at least a short paragraph.");
    if (!clip(job.employmentType, 40)) issues.push("Choose an employment type.");
    if (!clip(job.workMode, 40)) issues.push("Choose where the work happens.");
    if (job.workMode !== "Remote" && clip(job.location, 160).length < 2) {
      issues.push("Add a work location, or mark the role as remote.");
    }
    if (!isValidEmail(clip(job.contactEmail, 160)) && !isValidPhone(clip(job.contactPhone, 40))) {
      issues.push("Add a valid contact email or mobile number for this role.");
    }
  }
  if (job.contactEmail && !isValidEmail(clip(job.contactEmail, 160))) issues.push("Job contact email looks invalid.");
  if (job.contactPhone && !isValidPhone(clip(job.contactPhone, 40))) issues.push("Job contact mobile looks invalid.");
  if (job.salaryMin != null && (!Number.isFinite(job.salaryMin) || job.salaryMin < 0)) issues.push("Minimum pay is invalid.");
  if (job.salaryMax != null && (!Number.isFinite(job.salaryMax) || job.salaryMax < 0)) issues.push("Maximum pay is invalid.");
  if (job.salaryMin != null && job.salaryMax != null && job.salaryMin > job.salaryMax) {
    issues.push("Minimum pay cannot be higher than maximum pay.");
  }
  if (job.salaryVisibility === "disclosed" && mode === "publish" && job.salaryMin == null && job.salaryMax == null) {
    issues.push("Add a pay amount, or mark pay as negotiable or undisclosed.");
  }
  if (!Number.isInteger(job.vacancies) || job.vacancies < 1 || job.vacancies > 999) {
    issues.push("Number of openings must be between 1 and 999.");
  }
  if (job.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(job.deadline)) issues.push("Application deadline must be a real date.");
  if (job.minAge != null && (!Number.isInteger(job.minAge) || job.minAge < 14 || job.minAge > 80)) {
    issues.push("Minimum age must be between 14 and 80, or left blank.");
  }
  if (job.formMode === "custom") {
    const questions = normaliseQuestions(job.questions);
    if (mode === "publish" && questions.length === 0) issues.push("Add at least one application question.");
    const nameMaps = questions.filter((q) => q.mapsTo === "name");
    const emailMaps = questions.filter((q) => q.mapsTo === "email");
    const phoneMaps = questions.filter((q) => q.mapsTo === "phone");
    if (mode === "publish" && nameMaps.length !== 1) issues.push("Mark exactly one question as the applicant's name.");
    if (mode === "publish" && emailMaps.length + phoneMaps.length < 1) {
      issues.push("Mark an email or mobile question so you can reply to the applicant.");
    }
    if (nameMaps.some((q) => !q.required) || emailMaps.concat(phoneMaps).some((q) => !q.required)) {
      if (mode === "publish") issues.push("Name, email, and mobile questions that identify the applicant must be required.");
    }
    for (const question of questions) {
      if (!question.label) issues.push("Every question needs a label.");
      if ((question.type === "dropdown" || question.type === "single" || question.type === "multi") && question.options.length < 2) {
        issues.push(`“${question.label || "Choice question"}” needs at least two options.`);
      }
    }
  }
  return issues;
}

export function profileIssues(profile: EmployerInput, mode: "save" | "publish"): string[] {
  const issues: string[] = [];
  if (clip(profile.displayName, 120).length < 2) issues.push("Add the name candidates should see.");
  const slug = slugify(profile.slug || profile.displayName);
  issues.push(...validateSlug(slug, "Page link"));
  if (profile.employerType !== "individual" && profile.employerType !== "business") {
    issues.push("Choose individual employer or business.");
  }
  if (!TEMPLATE_IDS.includes(profile.templateId)) issues.push("Choose a hiring-page template.");
  if (!isHexColor(profile.brandPrimary) || !isHexColor(profile.brandAccent)) issues.push("Brand colours must be hex values.");
  if (profile.phone && !isValidPhone(profile.phone)) issues.push("Mobile number format is not valid.");
  if (profile.contactEmail && !isValidEmail(profile.contactEmail)) issues.push("Contact email looks invalid.");
  if (profile.website && !/^https?:\/\/[^\s]+$/i.test(profile.website)) {
    issues.push("Website must start with http:// or https://.");
  }
  if (clip(profile.socialLinks, 300).length > 300) issues.push("Social links are too long.");
  if (mode === "publish") {
    if (!profile.acceptIdentity) issues.push("Accept the identity declaration before publishing.");
    if (!profile.acceptPolicies) issues.push("Accept the employer terms before publishing.");
    if (!isValidPhone(profile.phone)) issues.push("Add a valid mobile number before publishing.");
    if (clip(profile.city, 80).length < 2) issues.push("Add a city before publishing.");
  }
  return issues;
}

export function basicGaps(input: {
  emailVerified: boolean;
  phone: string;
  identityAccepted: boolean;
  policiesAccepted: boolean;
}): string[] {
  const gaps: string[] = [];
  if (!input.emailVerified) gaps.push("Login email is not verified yet.");
  if (!isValidPhone(input.phone)) gaps.push("A format-valid mobile number is still needed.");
  if (!input.identityAccepted) gaps.push("The identity declaration has not been accepted.");
  if (!input.policiesAccepted) gaps.push("Employer terms have not been accepted.");
  return gaps;
}

export function decodeBase64(input: string): Uint8Array | null {
  const cleaned = input.replace(/^data:[^;]+;base64,/i, "").replace(/\s/g, "");
  if (!cleaned || cleaned.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) return null;
  try {
    const bin = atob(cleaned);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export type SniffedKind = "pdf" | "docx" | "doc" | "txt" | "png" | "jpeg" | "webp";

function starts(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((byte, index) => bytes[index] === byte);
}

export function sniffFile(bytes: Uint8Array): { mime: string; kind: SniffedKind } | null {
  if (starts(bytes, [0x25, 0x50, 0x44, 0x46])) return { mime: "application/pdf", kind: "pdf" };
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", kind: "png" };
  if (starts(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", kind: "jpeg" };
  if (
    starts(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.length > 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", kind: "webp" };
  }
  if (starts(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "docx" };
  }
  if (starts(bytes, [0xd0, 0xcf, 0x11, 0xe0])) return { mime: "application/msword", kind: "doc" };
  if (bytes.length > 0 && bytes.length <= 400_000 && !bytes.includes(0)) {
    let printable = 0;
    for (const byte of bytes) if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)) printable += 1;
    if (printable / bytes.length > 0.95) return { mime: "text/plain", kind: "txt" };
  }
  return null;
}

export function inspectUpload(
  file: FilePayload,
  allowed: SniffedKind[],
  maxBytes: number,
): { ok: true; bytes: Uint8Array; mime: string; kind: SniffedKind; name: string } | { ok: false; error: string } {
  const name = clip(file.name, 120).replace(/[/\\]/g, "") || "file";
  const bytes = decodeBase64(file.dataBase64);
  if (!bytes) return { ok: false, error: `${name} could not be read.` };
  if (bytes.length > maxBytes) return { ok: false, error: `${name} is larger than the allowed size.` };
  if (bytes.length < 8 && !allowed.includes("txt")) return { ok: false, error: `${name} looks empty.` };
  const sniffed = sniffFile(bytes);
  if (!sniffed || !allowed.includes(sniffed.kind)) {
    return { ok: false, error: `${name} must be one of: ${allowed.join(", ")}.` };
  }
  return { ok: true, bytes, mime: sniffed.mime, kind: sniffed.kind, name };
}

const IMAGE_KINDS: SniffedKind[] = ["png", "jpeg", "webp"];
const CV_KINDS: SniffedKind[] = ["pdf", "docx", "doc", "txt"];
const DOC_KINDS: SniffedKind[] = ["pdf", "png", "jpeg", "webp"];

export function inspectImage(file: FilePayload | null | undefined, label: string) {
  if (!file || !file.dataBase64) return { ok: true as const, data: "", mime: "", name: "" };
  const inspected = inspectUpload(file, IMAGE_KINDS, 350_000);
  if (!inspected.ok) return { ok: false as const, error: `${label}: ${inspected.error}` };
  return { ok: true as const, data: file.dataBase64.replace(/^data:[^;]+;base64,/i, ""), mime: inspected.mime, name: inspected.name };
}

export function inspectCv(file: FilePayload) {
  return inspectUpload(file, CV_KINDS, 1_200_000);
}

export function inspectEvidence(file: FilePayload) {
  return inspectUpload(file, DOC_KINDS, 1_800_000);
}

export function publishBlockers(input: {
  emailVerified: boolean;
  suspended: boolean;
  profile: EmployerInput;
  job: JobInput;
}): string[] {
  const issues: string[] = [];
  if (!input.emailVerified) {
    issues.push("Publishing stays locked until the login email is verified. No verification message can be sent until an email provider is connected.");
  }
  if (input.suspended) issues.push("This account is suspended and cannot publish.");
  issues.push(...profileIssues(input.profile, "publish"));
  issues.push(...jobIssues(input.job, "publish"));
  return issues;
}

export function validateApplication(
  job: {
    accepting: boolean;
    formMode: "standard" | "custom";
    standardFields: StandardFields;
    questions: PublicQuestion[];
    minAge: number | null;
  },
  input: ApplicationInput,
): string[] {
  if (!job.accepting) return ["This role is not accepting applications."];
  const issues: string[] = [];
  if (!input.consent) issues.push("Consent to the candidate privacy notice is required.");
  if (job.minAge != null && !input.ageConfirmed) {
    issues.push(`Confirm that you meet the minimum age of ${job.minAge} for this role.`);
  }
  if (job.formMode === "standard") {
    const fields = normaliseStandardFields(job.standardFields);
    const values: Record<FieldKey, string> = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      city: input.city,
      education: input.education,
      experience: input.experience,
      skills: input.skills,
      cv: input.cv ? "1" : "",
    };
    for (const key of FIELD_KEYS) {
      const rule = fields[key];
      if (!rule.enabled) continue;
      if (rule.required && !clip(values[key], 8000)) issues.push(`${FIELD_LABELS[key]} is required.`);
    }
    if (fields.email.enabled && input.email && !isValidEmail(input.email)) issues.push("Email looks invalid.");
    if (fields.phone.enabled && input.phone && !isValidPhone(input.phone)) issues.push("Mobile number looks invalid.");
    if (fields.cv.required && !input.cv) issues.push("A CV is required for this role.");
  } else {
    for (const question of job.questions) {
      const answer = input.answers.find((item) => item.questionId === question.id);
      const file = input.files.find((item) => item.questionId === question.id);
      const value = question.type === "file" ? (file ? "1" : "") : clip(answer?.value, 5000);
      if (question.required && !value) issues.push(`${question.label} is required.`);
      if (question.mapsTo === "email" && value && !isValidEmail(value)) issues.push(`${question.label} must be a valid email.`);
      if (question.mapsTo === "phone" && value && !isValidPhone(value)) issues.push(`${question.label} must be a valid mobile number.`);
      if ((question.type === "dropdown" || question.type === "single") && value && !question.options.includes(value)) {
        issues.push(`${question.label} has an unexpected choice.`);
      }
      if (question.type === "multi" && value) {
        try {
          const picked = JSON.parse(value) as unknown;
          if (!Array.isArray(picked) || picked.some((item) => typeof item !== "string" || !question.options.includes(item))) {
            issues.push(`${question.label} has an unexpected choice.`);
          }
        } catch {
          issues.push(`${question.label} could not be read.`);
        }
      }
      if (question.type === "yesno" && value && value !== "yes" && value !== "no") {
        issues.push(`${question.label} must be yes or no.`);
      }
    }
  }
  const name = resolvedName(job, input);
  const email = resolvedEmail(job, input);
  const phone = resolvedPhone(job, input);
  if (name.length < 2) issues.push("Add the applicant's name.");
  if (!email && !phone) issues.push("Add an email or mobile number.");
  if (email && !isValidEmail(email)) issues.push("Email looks invalid.");
  if (phone && !isValidPhone(phone)) issues.push("Mobile number looks invalid.");
  return issues;
}

export function resolvedName(
  job: { formMode: "standard" | "custom"; questions: PublicQuestion[] },
  input: ApplicationInput,
): string {
  if (job.formMode === "standard") return clip(input.name, 120);
  const question = job.questions.find((item) => item.mapsTo === "name");
  const answer = input.answers.find((item) => item.questionId === question?.id);
  return clip(answer?.value || input.name, 120);
}

export function resolvedEmail(
  job: { formMode: "standard" | "custom"; questions: PublicQuestion[] },
  input: ApplicationInput,
): string {
  if (job.formMode === "standard") return clip(input.email, 160);
  const question = job.questions.find((item) => item.mapsTo === "email");
  const answer = input.answers.find((item) => item.questionId === question?.id);
  return clip(answer?.value || "", 160);
}

export function resolvedPhone(
  job: { formMode: "standard" | "custom"; questions: PublicQuestion[] },
  input: ApplicationInput,
): string {
  if (job.formMode === "standard") return clip(input.phone, 40);
  const question = job.questions.find((item) => item.mapsTo === "phone");
  const answer = input.answers.find((item) => item.questionId === question?.id);
  return clip(answer?.value || "", 40);
}

export function resolvedCity(
  job: { formMode: "standard" | "custom"; questions: PublicQuestion[] },
  input: ApplicationInput,
): string {
  if (job.formMode === "standard") return clip(input.city, 80);
  const question = job.questions.find((item) => item.mapsTo === "city");
  const answer = input.answers.find((item) => item.questionId === question?.id);
  return clip(answer?.value || "", 80);
}

export function likeContains(value: string): string {
  return `%${value.replace(/[\\%_]/g, (mark) => `\\${mark}`)}%`;
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    bin += String.fromCharCode(...bytes.subarray(i, i + size));
  }
  return btoa(bin);
}

export function isJobStatus(value: string): value is (typeof JOB_STATUSES)[number] {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export function questionTypeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    short: "Short text",
    long: "Long text",
    email: "Email",
    phone: "Phone",
    number: "Number",
    dropdown: "Dropdown",
    single: "Single choice",
    multi: "Multiple choice",
    yesno: "Yes / no",
    date: "Date",
    file: "File upload",
  };
  return labels[type];
}

export function cvHasContent(cv: CvDocument): boolean {
  return Boolean(
    clip(cv.fullName, 120) &&
      (clip(cv.summary, 2000) ||
        cv.education.some((item) => item.school || item.qualification) ||
        cv.experience.some((item) => item.company || item.title) ||
        clip(cv.technicalSkills, 500) ||
        clip(cv.professionalSkills, 500)),
  );
}
