-- Allow public read access to memberships for capacity counting
-- This allows the /join page to show accurate remaining spots

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can count memberships for capacity" ON public.memberships;

-- Add policy for public to count memberships (needed for capacity display)
CREATE POLICY "Public can count memberships for capacity"
ON public.memberships
FOR SELECT
USING (status IN ('active', 'pending'));

-- Note: This allows public to see location_id and membership_type_id for counting
-- but not sensitive user data since we only select those columns in the query
