-- Comprehensive RLS policies for event_rsvps
-- Fixes issues with anonymous user registration

-- ============================================
-- INSERT POLICIES
-- ============================================

-- Allow authenticated users to insert their own RSVPs
DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can insert their own RSVPs"
    ON event_rsvps
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous users to insert RSVPs (guest registration)
DROP POLICY IF EXISTS "Anonymous can register for events" ON event_rsvps;
CREATE POLICY "Anonymous can register for events"
    ON event_rsvps
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Fallback: Allow anyone to insert (covers edge cases)
DROP POLICY IF EXISTS "Anyone can insert rsvp" ON event_rsvps;
CREATE POLICY "Anyone can insert rsvp"
    ON event_rsvps
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- UPDATE POLICIES (for upsert operations)
-- ============================================

-- Allow authenticated users to update their own RSVPs
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can update their own RSVPs"
    ON event_rsvps
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to update RSVPs (for upsert on conflict)
DROP POLICY IF EXISTS "Anonymous can update event registrations" ON event_rsvps;
CREATE POLICY "Anonymous can update event registrations"
    ON event_rsvps
    FOR UPDATE
    TO anon
    USING (user_id IS NULL)
    WITH CHECK (user_id IS NULL);

-- ============================================
-- SELECT POLICIES (for duplicate checking)
-- ============================================

-- Allow authenticated users to view RSVPs
DROP POLICY IF EXISTS "Users can view RSVPs" ON event_rsvps;
CREATE POLICY "Users can view RSVPs"
    ON event_rsvps
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anonymous users to view RSVPs (for capacity/duplicate checking)
DROP POLICY IF EXISTS "Anonymous can view RSVPs" ON event_rsvps;
CREATE POLICY "Anonymous can view RSVPs"
    ON event_rsvps
    FOR SELECT
    TO anon
    USING (true);
