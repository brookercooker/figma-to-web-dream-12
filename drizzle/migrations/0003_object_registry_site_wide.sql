ALTER TABLE public.object_registry ADD COLUMN IF NOT EXISTS site_wide boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.object_registry.site_wide IS 'Site-wide chrome (Header/Footer): no page copies, cannot be archived.';

ALTER TABLE public.object_registry DROP CONSTRAINT IF EXISTS object_registry_name_shape;
ALTER TABLE public.object_registry ADD CONSTRAINT object_registry_name_shape CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9 _()\-]{0,79}$');

CREATE OR REPLACE FUNCTION public.object_registry_protect_site_wide()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.site_wide AND NEW.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Site-wide objects cannot be archived';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS object_registry_protect_site_wide ON public.object_registry;
CREATE TRIGGER object_registry_protect_site_wide BEFORE INSERT OR UPDATE ON public.object_registry
FOR EACH ROW EXECUTE FUNCTION public.object_registry_protect_site_wide();

UPDATE public.object_registry SET site_wide = true WHERE component_key IN ('Header', 'Footer') AND archived_at IS NULL;