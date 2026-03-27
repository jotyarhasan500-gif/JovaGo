import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Returns a single Supabase client instance (singleton) to avoid Realtime TIMED_OUT/CLOSED from multiple instances.
 * Realtime uses explicit WebSocket transport to help bypass IPv6 routing issues.
 */
function looksLikeSupabaseJwt(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (process.env.NODE_ENV === "development" && !looksLikeSupabaseJwt(supabaseAnonKey)) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY should be a JWT with three dot-separated segments. Copy the anon key from Supabase → Project Settings → API. Trailing spaces in .env break Realtime WebSocket auth."
    );
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      transport: typeof WebSocket !== "undefined" ? WebSocket : undefined,
    },
  });
  return browserClient;
}
