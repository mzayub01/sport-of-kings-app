-- Allow parents to view their children's memberships
-- This enables the parent dashboard to show child membership cards

CREATE POLICY "Parents can view children memberships"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles child_profile
      JOIN public.profiles parent_profile ON child_profile.parent_guardian_id = parent_profile.id
      WHERE child_profile.user_id = memberships.user_id
        AND parent_profile.user_id = auth.uid()
    )
  );
