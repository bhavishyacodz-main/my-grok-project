const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

/** Parse a comma-separated exact-origin allowlist; paths and wildcards are rejected. */
export function parseAllowedOrigins(value: string | undefined): Set<string> {
  const origins = new Set<string>();
  for (const candidate of (value ?? "").split(",")) {
    const entry = candidate.trim();
    if (!entry) continue;
    let parsed: URL;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error("ALLOWED_ORIGINS must contain valid origin URLs.");
    }
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.origin !== entry ||
      entry.includes("*") ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error("ALLOWED_ORIGINS entries must be exact origins without paths, credentials or wildcards.");
    }
    origins.add(parsed.origin);
  }
  return origins;
}

export function isAllowedRequestOrigin(
  origin: string | null,
  configuredOrigins: ReadonlySet<string>,
): origin is string {
  if (!origin) return false;
  return configuredOrigins.has(origin) || LOCAL_DEVELOPMENT_ORIGINS.has(origin);
}
