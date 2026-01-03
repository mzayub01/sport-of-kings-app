-- Add phone column to event_rsvps table
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS phone TEXT;
