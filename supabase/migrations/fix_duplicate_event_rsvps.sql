-- Fix duplicate event RSVPs by adding unique constraint
-- Run this in Supabase SQL Editor

-- First, remove any existing duplicates (keep the earliest one)
DELETE FROM event_rsvps a
USING event_rsvps b
WHERE a.id > b.id
AND a.event_id = b.event_id
AND a.email = b.email;

-- Add unique constraint on event_id + email
-- This prevents the same email from registering twice for the same event
ALTER TABLE event_rsvps
ADD CONSTRAINT event_rsvps_event_email_unique 
UNIQUE (event_id, email);

-- Also add a partial unique constraint for user_id (when not null)
-- This prevents logged-in users from registering twice
CREATE UNIQUE INDEX IF NOT EXISTS event_rsvps_event_user_unique
ON event_rsvps (event_id, user_id)
WHERE user_id IS NOT NULL;
