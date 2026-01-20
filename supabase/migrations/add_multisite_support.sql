-- ===============================================
-- Multisite Membership Support
-- Adds ability for members to join multiple locations
-- ===============================================

-- Add multisite flag to locations (admin controls which locations allow multisite)
ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS allow_multisite boolean DEFAULT true;

-- Track primary vs additional memberships
ALTER TABLE public.memberships 
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT true;

-- Comment for clarity
COMMENT ON COLUMN public.locations.allow_multisite IS 'Whether this location is available for multisite membership add-ons';
COMMENT ON COLUMN public.memberships.is_primary IS 'True for the first/primary membership, false for additional multisite memberships';
