-- Adds sticker support to entries, so a "good" moment can be tagged with a
-- fun achievement sticker (star, medal, trophy, champion, winner) shown on
-- the calendar and in the Kids highlights reel.
-- Run this in the Supabase SQL Editor.

ALTER TABLE entries ADD COLUMN IF NOT EXISTS sticker TEXT;
