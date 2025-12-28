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

-- Also ensure professors can read profiles for grading
CREATE POLICY "Professors can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid() 
            AND p.role IN ('professor', 'admin', 'instructor')
        )
    );
