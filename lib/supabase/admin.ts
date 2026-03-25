import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses Row Level Security.
// Only import this in Route Handlers (server-side). Never expose to the browser.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
