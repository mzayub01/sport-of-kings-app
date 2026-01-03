-- Add RLS policy for users to delete their own event RSVPs
-- First, enable RLS on event_rsvps if not already enabled
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to delete their own RSVPs
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can delete their own RSVPs"
    ON event_rsvps
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own RSVPs
DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can insert their own RSVPs"
    ON event_rsvps
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy to allow users to view all RSVPs (for event capacity checking)
DROP POLICY IF EXISTS "Users can view RSVPs" ON event_rsvps;
CREATE POLICY "Users can view RSVPs"
    ON event_rsvps
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow anonymous users to insert RSVPs (guest registration)
DROP POLICY IF EXISTS "Anonymous can register for events" ON event_rsvps;
CREATE POLICY "Anonymous can register for events"
    ON event_rsvps
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);
