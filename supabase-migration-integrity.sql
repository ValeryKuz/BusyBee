-- BusyBee Data Integrity Migration
-- Run this by hand in the Supabase SQL Editor. Not executed automatically.
--
-- Follows up on supabase-migration-auth.sql's Step 7 (left commented out
-- there) and closes a gap where duplicate "completed today" entries are
-- only prevented by client-side React state, not the database.

-- Step 1: Reject duplicate same-day activity entries at the DB level.
-- Two tabs/devices tapping the same activity for the same child on the
-- same day previously produced two rows; the app only deduped in memory.
-- family_activity entries are excluded since those aren't per-child and
-- can legitimately repeat (e.g. logging the same family outing twice).
CREATE UNIQUE INDEX IF NOT EXISTS entries_unique_daily_activity
  ON entries (child_id, entry_date, icon, note)
  WHERE type != 'family_activity';

-- Step 2: Verify no NULL family_id rows remain before enforcing NOT NULL.
-- Run these first — if any return a non-zero count, find and fix those
-- rows (they're invisible under RLS to every family) before continuing.
SELECT count(*) AS null_children FROM children WHERE family_id IS NULL;
SELECT count(*) AS null_entries  FROM entries  WHERE family_id IS NULL;
SELECT count(*) AS null_events   FROM events   WHERE family_id IS NULL;
SELECT count(*) AS null_settings FROM settings WHERE family_id IS NULL;

-- Step 3: Once all four counts above are 0, enforce family_id going forward.
ALTER TABLE children ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE entries  ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE events   ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN family_id SET NOT NULL;
