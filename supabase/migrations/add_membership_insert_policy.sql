-- Add policy to allow users to create their own memberships during registration
-- This fixes the issue where new users can't insert memberships due to RLS

-- Policy for users to insert their own membership
CREATE POLICY "Users can create own membership"
  ON public.memberships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to insert to waitlist
CREATE POLICY "Users can join waitlist"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own waitlist position
CREATE POLICY "Users can view own waitlist"
  ON public.waitlist
  FOR SELECT
  USING (auth.uid() = user_id);
