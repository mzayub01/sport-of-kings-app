-- Allow instructors to read memberships so the instructor attendance page can
-- build a roster of active members at a class's location (previously it loaded
-- every profile in the club instead, with no membership filter).
CREATE POLICY "Instructors can view memberships"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'instructor'
    )
  );
