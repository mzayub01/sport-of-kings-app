-- Update stripes constraint to allow 0-12 for kids belt progression
-- The old constraint limited stripes to 0-4, but kids can have up to 12 stripes

-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_stripes_check;

-- Add a new constraint allowing 0-12 stripes
ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripes_check CHECK (stripes >= 0 AND stripes <= 12);
