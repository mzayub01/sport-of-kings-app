-- Allow professors to read memberships for grading purposes
-- Professors can read memberships at locations where they have class access

CREATE POLICY "Professors can view memberships for their classes" ON public.memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('professor', 'admin', 'instructor')
        )
    );

-- Note: Professors can view profiles via existing policies:
-- "Admin can view all profiles" covers admins
-- "Allow authenticated select profiles" covers professors/instructors
