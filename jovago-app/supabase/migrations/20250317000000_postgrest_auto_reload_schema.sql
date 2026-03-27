-- Reload PostgREST schema cache automatically after any DDL (e.g. migrations).
-- Run "NOTIFY pgrst, 'reload schema';" in SQL Editor for a one-time reload without this trigger.
CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch
  ON ddl_command_end
  EXECUTE PROCEDURE pgrst_watch();
