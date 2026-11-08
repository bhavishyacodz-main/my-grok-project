/** Operator identity is configuration, never invented registration data. */
export const operator = {
  productName: "Brandvika",
  legalName: "",
  grievanceName: "",
  grievanceEmail: "",
  privacyEmail: "",
  postalAddress: "",
  noticeVersion: "2026-11-09-draft",
  publicHiringBaseUrl: import.meta.env.VITE_PUBLIC_HIRING_BASE_URL?.replace(/\/$/, "") ?? "",
};

export function operatorLabel(): string {
  return operator.legalName || "Platform operator legal name is not configured";
}
