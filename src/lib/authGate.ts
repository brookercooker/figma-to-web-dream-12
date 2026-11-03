import { supabase } from "@/integrations/supabase/client";

/** temporary: restore before real use. Applies everywhere, not just preview hosts. */
export const REQUIRE_LOGIN = false;
export const SIGN_IN_REQUIRED = "Sign in to load or save this";
export async function hasManagerUser(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error && !!data?.session?.user;
  } catch { return false; }
}