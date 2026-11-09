import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { isAllowedRequestOrigin, parseAllowedOrigins } from "../../../src/lib/security/origin-allowlist.ts";
import { validateJobDraft, type JobDraftInput } from "../../../src/lib/jobs/validation.ts";

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
  const headers = corsHeaders(request.headers.get("origin"));
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, headers);
  if (headers["Access-Control-Allow-Origin"] === "null") {
    return json({ error: "Origin is not allowed." }, 403, headers);
  }

  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Authentication is required." }, 401, headers);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json({ error: "The job service is not configured." }, 503, headers);
  }

  const auth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user || !authData.user.email_confirmed_at) {
    return json({ error: "A verified employer account is required." }, 401, headers);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "A valid JSON body is required." }, 400, headers);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userId = authData.user.id;

  const { data: profile, error: profileError } = await admin
    .from("employer_profiles")
    .select("user_id, suspended_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) return json({ error: "Could not verify the employer profile." }, 500, headers);
  if (!profile) return json({ error: "Complete your employer profile before creating jobs." }, 409, headers);
  if (profile.suspended_at) return json({ error: "This employer workspace is currently restricted." }, 403, headers);

  if (payload.action === "list") {
    const { data, error } = await admin
      .from("jobs")
      .select("id, title, slug, status, category, location, employment_type, work_mode, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return json({ error: "Could not load your jobs." }, 500, headers);
    return json({ jobs: data ?? [] }, 200, headers);
  }

  if (payload.action === "create") {
    const input: JobDraftInput = {
      title: typeof payload.title === "string" ? payload.title : "",
      category: typeof payload.category === "string" ? payload.category : "",
      description: typeof payload.description === "string" ? payload.description : "",
      location: typeof payload.location === "string" ? payload.location : "",
      employmentType: payload.employmentType as JobDraftInput["employmentType"],
      workMode: payload.workMode as JobDraftInput["workMode"],
    };
    const validation = validateJobDraft(input);
    if (!validation.ok) return json({ error: validation.message }, 400, headers);

    const id = crypto.randomUUID();
    const slugBase = validation.value.title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "job";
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

    const { data, error } = await admin
      .from("jobs")
      .insert({
        id,
        user_id: userId,
        title: validation.value.title,
        slug,
        status: "draft",
        category: validation.value.category,
        description: validation.value.description,
        location: validation.value.location,
        employment_type: validation.value.employmentType,
        work_mode: validation.value.workMode,
      })
      .select("id, title, slug, status, category, location, employment_type, work_mode, created_at, updated_at")
      .single();
    if (error) return json({ error: "Could not save this job draft." }, 500, headers);
    return json({ job: data }, 201, headers);
  }

  if (payload.action === "update_status") {
    const jobId = typeof payload.jobId === "string" ? payload.jobId : "";
    const status = payload.status;
    if (!jobId || !["draft", "paused", "closed", "archived"].includes(String(status))) {
      return json({ error: "Choose a valid job and draft, paused, closed or archived status." }, 400, headers);
    }
    const { data, error } = await admin
      .from("jobs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("user_id", userId)
      .select("id, title, slug, status, category, location, employment_type, work_mode, created_at, updated_at")
      .maybeSingle();
    if (error) return json({ error: "Could not update this job." }, 500, headers);
    if (!data) return json({ error: "Job not found in your workspace." }, 404, headers);
    return json({ job: data }, 200, headers);
  }

  return json({ error: "Unknown job action." }, 400, headers);
});
