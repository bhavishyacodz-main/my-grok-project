export const AUTH_CALLBACK_PATH = "/auth/callback";
export const PASSWORD_RESET_PATH = "/reset-password";

/** Build same-origin callback URLs for the deployment that starts sign-in. */
export function getAuthRedirectUrl(origin: string, path: string): string {
  const base = new URL(origin);
  const target = new URL(path, base);
  if (target.origin !== base.origin) {
    throw new Error("Authentication redirects must stay on the current site.");
  }
  return target.toString();
}
