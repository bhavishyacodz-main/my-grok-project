import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { isAllowedRequestOrigin, parseAllowedOrigins } from "../../../src/lib/security/origin-allowlist.ts";

const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

function corsHeaders(origin: string | null): Record<string, string> {
  const permitted = isAllowedRequestOrigin(origin, allowedOrigins);
  return {
    "Access-Control-Allow-Origin": permitted ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, headers);
  }
  if (headers["Access-Control-Allow-Origin"] === "null") {
    return json({ error: "Origin is not allowed." }, 403, headers);
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Authentication is required." }, 401, headers);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "The employer profile service is not configured." }, 503, headers);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user || !authData.user.email_confirmed_at) {
    return json({ error: "A verified employer account is required." }, 401, headers);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "A valid JSON body is required." }, 400, headers);
  }

  const employerType = payload.employerType;
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const city = typeof payload.city === "string" ? payload.city.trim() : "";
  const region = typeof payload.region === "string" ? payload.region.trim() : "";
  const contactEmail = typeof payload.contactEmail === "string"
    ? payload.contactEmail.trim().toLowerCase()
    : "";

  if (employerType !== "individual" && employerType !== "business") {
    return json({ error: "Choose an individual or business profile." }, 400, headers);
  }
  if (displayName.length < 2 || displayName.length > 120) {
    return json({ error: "Enter a name between 2 and 120 characters." }, 400, headers);
  }
  if (city.length > 80 || region.length > 80) {
    return json({ error: "City and region must each be 80 characters or fewer." }, 400, headers);
  }
  if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return json({ error: "Enter a valid contact email address." }, 400, headers);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = authData.user.id;
  const { data: existing, error: lookupError } = await admin
    .from("employer_profiles")
    .select("user_id, display_name, slug")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    return json({ error: "Could not check the existing employer profile." }, 500, headers);
  }
  if (existing) {
    return json({ profile: existing, existing: true }, 200, headers);
  }

  const slugBase = displayName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "employer";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: profile, error: insertError } = await admin
    .from("employer_profiles")
    .insert({
      user_id: userId,
      employer_type: employerType,
      display_name: displayName,
      slug,
      city,
      region,
      contact_email: contactEmail,
      template_id: "small-business",
      page_visible: false,
    })
    .select("user_id, display_name, slug, employer_type, city, region, contact_email")
    .single();

  if (insertError) {
    return json({ error: "Could not create the employer profile. Please try again." }, 500, headers);
  }
  return json({ profile, existing: false }, 201, headers);
});
