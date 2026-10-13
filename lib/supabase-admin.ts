
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error("Supabase server configuration is missing.");
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  secretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
