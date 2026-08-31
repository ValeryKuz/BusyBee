-- Adds image support to entries, so gift entries (e.g. a specific Lego set) can show a picture on the calendar.
-- Run this in the Supabase SQL Editor.

ALTER TABLE entries ADD COLUMN IF NOT EXISTS image_url TEXT;
