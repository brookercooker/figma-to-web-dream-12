ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS inline_edits jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE public.object_registry ADD COLUMN IF NOT EXISTS inline_edits jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.objects ADD COLUMN IF NOT EXISTS content jsonb;

-- TEMPORARY: open access while building. Drop every policy named dev_open_* before launch.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pages','object_registry','objects','images','videos','page_objects','tags',
    'image_page_usages','video_page_usages','object_page_usages','page_redirects','link_audit_rows','link_audit_meta']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS dev_open_all ON public.%I', t);
    EXECUTE format('CREATE POLICY dev_open_all ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;