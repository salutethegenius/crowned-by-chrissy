CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "CalendarSlot"
  ADD COLUMN IF NOT EXISTS span tstzrange NOT NULL DEFAULT 'empty';

CREATE OR REPLACE FUNCTION calendar_slot_span_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.span := tstzrange(NEW."startAt", NEW."endAt", '[)');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calendar_slot_span_sync ON "CalendarSlot";
CREATE TRIGGER calendar_slot_span_sync
  BEFORE INSERT OR UPDATE OF "startAt", "endAt" ON "CalendarSlot"
  FOR EACH ROW
  EXECUTE FUNCTION calendar_slot_span_sync();

UPDATE "CalendarSlot"
SET span = tstzrange("startAt", "endAt", '[)');

ALTER TABLE "CalendarSlot"
  DROP CONSTRAINT IF EXISTS calendar_slots_no_overlap;

ALTER TABLE "CalendarSlot"
  ADD CONSTRAINT calendar_slots_no_overlap
  EXCLUDE USING gist (span WITH &&);
