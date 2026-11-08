export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "temporary",
  "apprenticeship",
  "freelance",
] as const;

export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];

export type JobDraftInput = {
  title: string;
  category: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
};

export type JobDraftValidation =
  | { ok: true; value: JobDraftInput }
  | { ok: false; message: string };

export function validateJobDraft(input: JobDraftInput): JobDraftValidation {
  const title = input.title.trim();
  const category = input.category.trim();
  const description = input.description.trim();
  const location = input.location.trim();

  if (title.length < 5 || title.length > 120) {
    return { ok: false, message: "Job title must be between 5 and 120 characters." };
  }
  if (category.length > 80 || location.length > 120) {
    return { ok: false, message: "Category or location is too long." };
  }
  if (description.length < 30 || description.length > 12000) {
    return { ok: false, message: "Add a job description between 30 and 12,000 characters." };
  }
  if (!EMPLOYMENT_TYPES.includes(input.employmentType) || !WORK_MODES.includes(input.workMode)) {
    return { ok: false, message: "Choose a valid employment type and work mode." };
  }
  return {
    ok: true,
    value: { title, category, description, location, employmentType: input.employmentType, workMode: input.workMode },
  };
}
