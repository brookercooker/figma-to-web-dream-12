/**
 * The one place the public site gets its database client from.
 *
 * In this prototype it is the in-memory demo client. When the public site becomes its own project, this file is the only
 * one that changes: it will export the real Supabase client instead. Public pages and components import `supabase` from
 * here and never from `@/prototype/client` or from anything under `pages/admin`.
 */
export { supabase, adminCatalog } from "@/prototype/client";
