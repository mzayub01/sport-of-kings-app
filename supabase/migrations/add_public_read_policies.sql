-- Add public read access for locations
-- This allows anyone to view active locations for registration

-- Enable RLS on locations if not already enabled
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing public policy if it exists
DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;

-- Create public read policy for active locations
CREATE POLICY "Public can view active locations"
  ON public.locations
  FOR SELECT
  USING (is_active = true);

-- Also allow public access to membership_types for registration
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active membership types" ON public.membership_types;

CREATE POLICY "Public can view active membership types"
  ON public.membership_types
  FOR SELECT
  USING (is_active = true);

-- Also allow public access to location_membership_configs for capacity checks
ALTER TABLE public.location_membership_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view capacity configs" ON public.location_membership_configs;

CREATE POLICY "Public can view capacity configs"
  ON public.location_membership_configs
  FOR SELECT
  USING (true);
