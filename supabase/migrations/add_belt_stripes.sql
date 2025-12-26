-- Add stripes column to profiles for BJJ belt grading
-- Each belt can have 0-4 stripes

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripes integer DEFAULT 0 
CHECK (stripes >= 0 AND stripes <= 4);

COMMENT ON COLUMN public.profiles.stripes IS 'Number of stripes on the belt (0-4)';
