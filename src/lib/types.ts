export const TEMPLATE_IDS = [
  "small-business",
  "corporate",
  "creative-gaming",
  "cultural-festival",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const FIELD_KEYS = [
  "name",
  "email",
  "phone",
  "city",
  "education",
  "experience",
  "skills",
  "cv",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

export type FieldRule = { enabled: boolean; required: boolean };
export type StandardFields = Record<FieldKey, FieldRule>;

export const QUESTION_TYPES = [
  "short",
  "long",
  "email",
  "phone",
  "number",
  "dropdown",
  "single",
  "multi",
  "yesno",
  "date",
  "file",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const MAPS_TO = ["", "name", "email", "phone", "city"] as const;
export type MapsTo = (typeof MAPS_TO)[number];

export type QuestionInput = {
  id: string;
  type: QuestionType;
  label: string;
  help: string;
  required: boolean;
  options: string[];
  mapsTo: MapsTo;
};

export const JOB_STATUSES = ["draft", "published", "paused", "closed", "archived"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const STAGES = [
  "applied",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "selected",
  "rejected",
  "withdrawn",
] as const;

export type Stage = (typeof STAGES)[number];

export const SALARY_VISIBILITY = ["disclosed", "negotiable", "undisclosed"] as const;
export type SalaryVisibility = (typeof SALARY_VISIBILITY)[number];

export type JobInput = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  skillsRequired: string;
  skillsPreferred: string;
  experience: string;
  employmentType: string;
  location: string;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryVisibility: SalaryVisibility;
  workingHours: string;
  vacancies: number;
  deadline: string;
  contactEmail: string;
  contactPhone: string;
  minAge: number | null;
  formMode: "standard" | "custom";
  standardFields: StandardFields;
  questions: QuestionInput[];
};

export type EmployerInput = {
  employerType: "individual" | "business";
  displayName: string;
  slug: string;
  headline: string;
  description: string;
  industry: string;
  city: string;
  region: string;
  phone: string;
  website: string;
  socialLinks: string;
  contactEmail: string;
  templateId: TemplateId;
  brandPrimary: string;
  brandAccent: string;
  acceptIdentity: boolean;
  acceptPolicies: boolean;
  pageVisible: boolean;
  logoData: string;
  coverData: string;
};

export type PublicEmployer = {
  displayName: string;
  employerType: "individual" | "business";
  slug: string;
  headline: string;
  description: string;
  industry: string;
  city: string;
  region: string;
  phone: string;
  website: string;
  socialLinks: string;
  contactEmail: string;
  logoData: string;
  coverData: string;
  templateId: TemplateId;
  brandPrimary: string;
  brandAccent: string;
  basicReady: boolean;
  businessApproved: boolean;
};

export type PublicQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  help: string;
  required: boolean;
  options: string[];
  mapsTo: MapsTo;
};

export type PublicJob = {
  title: string;
  slug: string;
  category: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  skillsRequired: string;
  skillsPreferred: string;
  experience: string;
  employmentType: string;
  location: string;
  workMode: string;
  salaryLabel: string;
  workingHours: string;
  vacancies: number;
  deadline: string | null;
  accepting: boolean;
  minAge: number | null;
  contactEmail: string;
  contactPhone: string;
  formMode: "standard" | "custom";
  standardFields: StandardFields;
  questions: PublicQuestion[];
};

export type CvStyle = "simple" | "modern" | "minimal" | "fresher" | "experienced";

export type CvEducation = { school: string; qualification: string; years: string };
export type CvRole = { company: string; title: string; duration: string; details: string };
export type CvExtra = { title: string; detail: string };

export type CvDocument = {
  style: CvStyle;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  education: CvEducation[];
  experience: CvRole[];
  technicalSkills: string;
  professionalSkills: string;
  languages: string;
  projects: CvExtra[];
  certifications: CvExtra[];
  internships: CvExtra[];
  achievements: CvExtra[];
};

export type FilePayload = { name: string; dataBase64: string };

export type AnswerInput = { questionId: string; value: string };

export type ApplicationInput = {
  employerSlug: string;
  jobSlug: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  education: string;
  experience: string;
  skills: string;
  answers: AnswerInput[];
  cv: FilePayload | null;
  cvSource: "" | "upload" | "builder";
  files: { questionId: string; file: FilePayload }[];
  consent: boolean;
  ageConfirmed: boolean;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};
