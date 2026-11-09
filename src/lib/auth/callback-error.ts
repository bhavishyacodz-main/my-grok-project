/** Read OAuth provider errors from Supabase's callback query without hiding the useful cause. */
export function getAuthCallbackError(params: URLSearchParams): string | null {
  const code = params.get("error");
  const description = params.get("error_description");
  if (!code && !description) return null;

  const safeDescription = (description ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  if (safeDescription) return `Sign-in was not completed: ${safeDescription}`;
  if (code) return `Sign-in was not completed (${code.slice(0, 80)}). Please return to login and try again.`;
  return "Sign-in was not completed. Please return to login and try again.";
}
