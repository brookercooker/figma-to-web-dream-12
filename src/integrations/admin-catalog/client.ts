import { createClient } from "@supabase/supabase-js";

// Read-only Supabase client for the Admin Tools catalog (separate project).
// DO NOT confuse with this project's own Lovable Cloud client at
// src/integrations/supabase/client.ts.
//
// Allowed reads (per Admin Tools policy):
//   - public.catalog (16-column safe view — the contract)
//   - public.xologic_app_assignments (filtered to app='website')
// Forbidden: xologic_products and any other xologic_* table directly.

const ADMIN_CATALOG_URL = "https://prhfjbtdrniuithsmuqt.supabase.co";
const ADMIN_CATALOG_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGZqYnRkcm5pdWl0aHNtdXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTkyMzIsImV4cCI6MjA5NDA5NTIzMn0.NzsEbJao3m8O7xUuWxKTxENdlfcZqaczFNugcMnsHU8";

export const adminCatalog = createClient(ADMIN_CATALOG_URL, ADMIN_CATALOG_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
