-- BusyBee Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Children table (no honey counter - computed from entries)
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries table (behavior logs with date for filtering)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  note TEXT DEFAULT '',
  honey INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table (upcoming family events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  icon TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Birthdays table (recurring, stored as MM-DD)
CREATE TABLE birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  month_day TEXT NOT NULL,
  icon TEXT DEFAULT '🎂',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (app settings like daily fun category)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_entries_child_date ON entries(child_id, entry_date);
CREATE INDEX idx_entries_date ON entries(entry_date);
CREATE INDEX idx_events_date ON events(event_date);

-- Row Level Security (RLS) - disabled for simplicity in family app
-- If you want to add authentication later, enable RLS and add policies
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (family app, no auth)
CREATE POLICY "Allow all for children" ON children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for entries" ON entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for birthdays" ON birthdays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
