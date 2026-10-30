UPDATE public.pages SET archived_at = now() WHERE id = '4f23b14c-e263-4be8-9d17-b74e27781372' AND path LIKE '/\_\_object/%' AND archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.pages_touch_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF ROW(NEW.name, NEW.path, NEW.slug_id, NEW.page_type, NEW.status,
         NEW.start_at, NEW.end_at, NEW.notes, NEW.description, NEW.tags,
         NEW.archived_at, NEW.content, NEW.inline_edits)
     IS DISTINCT FROM
     ROW(OLD.name, OLD.path, OLD.slug_id, OLD.page_type, OLD.status,
         OLD.start_at, OLD.end_at, OLD.notes, OLD.description, OLD.tags,
         OLD.archived_at, OLD.content, OLD.inline_edits)
  THEN NEW.updated_at := now();
  ELSE NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.object_registry_touch_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF ROW(NEW.name, NEW.slug_id, NEW.description, NEW.status,
         NEW.labels, NEW.archived_at, NEW.intended_pages, NEW.component_key,
         NEW.content, NEW.inline_edits)
     IS DISTINCT FROM
     ROW(OLD.name, OLD.slug_id, OLD.description, OLD.status,
         OLD.labels, OLD.archived_at, OLD.intended_pages, OLD.component_key,
         OLD.content, OLD.inline_edits)
  THEN NEW.updated_at := now();
  ELSE NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END $function$;