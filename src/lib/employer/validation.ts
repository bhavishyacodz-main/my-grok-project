export type EmployerType = "individual" | "business";

export type EmployerProfileInput = {
  employerType: EmployerType;
  displayName: string;
  city: string;
  region: string;
  contactEmail: string;
};

export type EmployerProfileValidation =
  | { ok: true; value: EmployerProfileInput }
  | { ok: false; message: string };

export function validateEmployerProfile(
  input: EmployerProfileInput,
): EmployerProfileValidation {
  const displayName = input.displayName.trim();
  const city = input.city.trim();
  const region = input.region.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();

  if (input.employerType !== "individual" && input.employerType !== "business") {
    return { ok: false, message: "Choose an individual or business profile." };
  }
  if (displayName.length < 2 || displayName.length > 120) {
    return { ok: false, message: "Enter a name between 2 and 120 characters." };
  }
  if (city.length > 80 || region.length > 80) {
    return { ok: false, message: "City and region must each be 80 characters or fewer." };
  }
  if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { ok: false, message: "Enter a valid contact email address." };
  }

  return {
    ok: true,
    value: { employerType: input.employerType, displayName, city, region, contactEmail },
  };
}
