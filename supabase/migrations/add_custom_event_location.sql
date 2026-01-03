-- Add custom_location column to events table for non-training location events
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_location TEXT;

-- Add comment for clarity
COMMENT ON COLUMN events.custom_location IS 'Free-text location for events not held at a standard training location';
