-- One-off batch fix: assigns Eithan/Libi as participants on upcoming events
-- (event_date >= today) whose title or note already mentions their name,
-- using the same participant-encoding format the app writes when you pick
-- "Who?" on an event (the kid's avatar emoji prepended to the note, e.g.
-- "🐰 | Trip to the zoo"). Multi-kid events (title/note mentions both names)
-- get both avatars. Run in the Supabase SQL Editor.
--
-- 1) Run the SELECT first and review which events would be touched.
-- 2) Then run the UPDATE. It's safe to re-run - it skips events whose note
--    already contains the full avatar combo it would write.

-- Preview
SELECT e.id, e.title, e.event_date, e.note,
       string_agg(DISTINCT c.name, ', ') AS matched_kids,
       string_agg(DISTINCT c.avatar, ' ') AS avatars_to_add
FROM events e
JOIN children c ON e.family_id = c.family_id
  AND c.name IN ('Eithan', 'Libi')
  AND (e.title ILIKE '%' || c.name || '%' OR e.note ILIKE '%' || c.name || '%')
WHERE e.event_date >= CURRENT_DATE
GROUP BY e.id, e.title, e.event_date, e.note
ORDER BY e.event_date;

-- Update
WITH matches AS (
  SELECT e.id AS event_id,
         string_agg(DISTINCT c.avatar, ' ' ORDER BY c.avatar) AS avatars
  FROM events e
  JOIN children c ON e.family_id = c.family_id
    AND c.name IN ('Eithan', 'Libi')
    AND (e.title ILIKE '%' || c.name || '%' OR e.note ILIKE '%' || c.name || '%')
  WHERE e.event_date >= CURRENT_DATE
  GROUP BY e.id
)
UPDATE events e
SET note = m.avatars || CASE WHEN COALESCE(e.note, '') = '' THEN '' ELSE ' | ' || e.note END
FROM matches m
WHERE e.id = m.event_id
  AND COALESCE(e.note, '') NOT LIKE '%' || m.avatars || '%';
