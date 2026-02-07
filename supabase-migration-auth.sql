-- BusyBee Multi-Family Authentication Migration
-- Run this in Supabase SQL Editor AFTER creating your account (valery.k18@gmail.com)

-- Step 0: Add birthday column to children table (full date YYYY-MM-DD)
ALTER TABLE children ADD COLUMN IF NOT EXISTS birthday DATE;

-- Step 1: Add family_id column to all data tables
ALTER TABLE children ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES auth.users(id);
ALTER TABLE entries ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES auth.users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES auth.users(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES auth.users(id);

-- Drop the old unique constraint on settings.key and create new one with family_id
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key;
ALTER TABLE settings ADD CONSTRAINT settings_key_family_unique UNIQUE (key, family_id);

-- Step 2: Create indexes for family_id queries
CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_entries_family ON entries(family_id);
CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_settings_family ON settings(family_id);

-- Step 3: Drop old permissive policies
DROP POLICY IF EXISTS "Allow all for children" ON children;
DROP POLICY IF EXISTS "Allow all for entries" ON entries;
DROP POLICY IF EXISTS "Allow all for events" ON events;
DROP POLICY IF EXISTS "Allow all for settings" ON settings;

-- Step 4: Create new RLS policies that filter by authenticated user's family_id
CREATE POLICY "Family access for children" ON children
  FOR ALL USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "Family access for entries" ON entries
  FOR ALL USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "Family access for events" ON events
  FOR ALL USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "Family access for settings" ON settings
  FOR ALL USING (family_id = auth.uid())
  WITH CHECK (family_id = auth.uid());

-- Step 5: Migrate existing data to valery.k18@gmail.com
-- Run this AFTER the user has been created (either via signup or Google OAuth)
UPDATE children SET family_id = (SELECT id FROM auth.users WHERE email = 'valery.k18@gmail.com') WHERE family_id IS NULL;
UPDATE entries SET family_id = (SELECT id FROM auth.users WHERE email = 'valery.k18@gmail.com') WHERE family_id IS NULL;
UPDATE events SET family_id = (SELECT id FROM auth.users WHERE email = 'valery.k18@gmail.com') WHERE family_id IS NULL;
UPDATE settings SET family_id = (SELECT id FROM auth.users WHERE email = 'valery.k18@gmail.com') WHERE family_id IS NULL;

-- Step 6: Drop birthdays table (birthdays are now stored on children table)
DROP TABLE IF EXISTS birthdays;

-- Step 7: Make family_id NOT NULL after migration (optional but recommended)
-- Uncomment these after verifying the migration worked:
-- ALTER TABLE children ALTER COLUMN family_id SET NOT NULL;
-- ALTER TABLE entries ALTER COLUMN family_id SET NOT NULL;
-- ALTER TABLE events ALTER COLUMN family_id SET NOT NULL;
-- ALTER TABLE settings ALTER COLUMN family_id SET NOT NULL;
