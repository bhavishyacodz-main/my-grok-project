export type EmployerAuthMode = "signin" | "signup";

export type EmployerCredentialsResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

export function validateEmployerCredentials(
  email: string,
  password: string,
  mode: EmployerAuthMode,
): EmployerCredentialsResult {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!password) {
    return { ok: false, message: "Enter your password." };
  }

  if (mode === "signup" && password.length < 8) {
    return { ok: false, message: "Use a password with at least 8 characters." };
  }

  return { ok: true, email: normalizedEmail };
}
