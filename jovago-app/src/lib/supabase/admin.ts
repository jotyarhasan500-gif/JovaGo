import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client with service role. Use for vault uploads and other
 * server-side operations that bypass RLS. Never expose this client or the key to the browser.
 */
export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client"
    );
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
}

export function hasVaultStorage(): boolean {
  return !!(supabaseUrl && supabaseServiceRoleKey);
}
