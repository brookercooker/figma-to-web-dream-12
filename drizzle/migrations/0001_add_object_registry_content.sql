alter table public.object_registry add column if not exists content jsonb;
grant select (content), insert (content), update (content) on public.object_registry to authenticated;