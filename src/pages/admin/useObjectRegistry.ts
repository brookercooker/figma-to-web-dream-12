import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ObjectStatus = "Draft" | "Ready";

export interface ObjectRegistryRow {
  id: string;
  slug_id: string;
  name: string;
  status: ObjectStatus;
  component_key: string | null;
  description: string | null;
  intended_pages: string[];
  labels: string[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  thumbnail_updated_at: string | null;
  thumbnail_build_version: string | null;
}

export function useObjectRegistry() {
  return useQuery({
    queryKey: ["admin", "object_registry"],
    queryFn: async (): Promise<ObjectRegistryRow[]> => {
      const { data, error } = await (supabase as any)
        .from("object_registry")
        .select("*")
        .is("archived_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []) as ObjectRegistryRow[];
    },
    staleTime: 30_000,
  });
}

export function useArchivedObjects() {
  return useQuery({
    queryKey: ["admin", "object_registry", "archived"],
    queryFn: async (): Promise<ObjectRegistryRow[]> => {
      const { data, error } = await (supabase as any)
        .from("object_registry")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ObjectRegistryRow[];
    },
    staleTime: 30_000,
  });
}

export function useCreateObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      intended_pages?: string[];
      labels?: string[];
    }) => {
      const { data, error } = await (supabase as any)
        .from("object_registry")
        .insert({
          name: payload.name,
          status: "Draft",
          component_key: null,
          description: payload.description ?? "",
          intended_pages: payload.intended_pages ?? [],
          labels: payload.labels ?? [],
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as ObjectRegistryRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
  });
}

export function useArchiveObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "object_registry"] });
    },
  });
}

export function useRestoreObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ archived_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "object_registry"] });
    },
  });
}

/** Flip status Ready → Draft. */
export function useRevertToDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ status: "Draft" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
  });
}

/** Flip status Draft → Ready. */
export function useMarkAsBuilt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ status: "Ready" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
  });
}

/** Set an object's work status explicitly (used by the WorkStatusPopover). */
export function useSetObjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "Draft" | "Ready" }) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
  });
}

/** Hard delete the object_registry row. No related join tables reference it. */
export function useDeleteObjectPermanent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("object_registry")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
  });
}
