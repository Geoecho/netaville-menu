import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Only public credentials belong in the browser. Authorisation lives in database policies.
export const supabase = url && key ? createClient(url, key) : null;
