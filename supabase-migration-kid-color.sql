-- Adds a color to each kid so their entries/events can be told apart on the
-- calendar. Run this in the Supabase SQL Editor.

ALTER TABLE children ADD COLUMN IF NOT EXISTS color TEXT;
