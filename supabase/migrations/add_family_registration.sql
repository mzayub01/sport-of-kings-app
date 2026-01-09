-- Add columns for family/group registration
-- Allows users to register additional attendees under one email

-- Add additional_attendees column (JSONB array of names)
ALTER TABLE event_rsvps 
ADD COLUMN IF NOT EXISTS additional_attendees JSONB DEFAULT '[]'::jsonb;

-- Add total_attendees column for capacity tracking
ALTER TABLE event_rsvps 
ADD COLUMN IF NOT EXISTS total_attendees INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN event_rsvps.additional_attendees IS 'JSON array of additional attendee names, e.g. ["Ahmed (child)", "Sara (spouse)"]';
COMMENT ON COLUMN event_rsvps.total_attendees IS 'Total number of attendees including primary registrant (1 + number of additional attendees)';
