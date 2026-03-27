import { createClient } from "@supabase/supabase-js";

// Uses ANON key only (NEXT_PUBLIC_SUPABASE_ANON_KEY). Never use Service Role key in client code.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
