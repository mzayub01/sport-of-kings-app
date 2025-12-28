-- Create promotions table for tracking belt grading history
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    promoted_by UUID NOT NULL REFERENCES auth.users(id),
    class_id UUID REFERENCES public.classes(id),
    previous_belt TEXT NOT NULL,
    previous_stripes INTEGER NOT NULL DEFAULT 0,
    new_belt TEXT NOT NULL,
    new_stripes INTEGER NOT NULL DEFAULT 0,
    comments TEXT,
    promotion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professor_class_access table for admin-controlled grading access
CREATE TABLE IF NOT EXISTS public.professor_class_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(professor_user_id, class_id)
);

-- Add is_kids_program to profiles to track which belt system to use
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_kids_program BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_promoted_by ON public.promotions(promoted_by);
CREATE INDEX IF NOT EXISTS idx_professor_class_access_professor ON public.professor_class_access(professor_user_id);
CREATE INDEX IF NOT EXISTS idx_professor_class_access_class ON public.professor_class_access(class_id);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_class_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions
CREATE POLICY "Users can view their own promotions" ON public.promotions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Professors and admins can view all promotions" ON public.promotions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('professor', 'admin')
        )
    );

CREATE POLICY "Professors can insert promotions for their classes" ON public.promotions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('professor', 'admin')
        )
    );

CREATE POLICY "Admins can update promotions" ON public.promotions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS policies for professor_class_access
CREATE POLICY "Professors can view their own class access" ON public.professor_class_access
    FOR SELECT USING (auth.uid() = professor_user_id);

CREATE POLICY "Admins can manage professor access" ON public.professor_class_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE public.promotions IS 'Tracks belt promotion history for members';
COMMENT ON TABLE public.professor_class_access IS 'Controls which classes each professor can grade';
COMMENT ON COLUMN public.profiles.is_kids_program IS 'If true, member uses kids belt system (grey/yellow/orange/green)';
