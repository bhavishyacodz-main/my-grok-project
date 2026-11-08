import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/**
 * Browser-safe Supabase client.
 * Only the publishable key belongs here. Never put a service-role or secret key
 * in a VITE_ variable or any other browser bundle.
 */
export const supabase =
  supabaseUrl && publishableKey
    ? createClient(supabaseUrl, publishableKey, {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);
