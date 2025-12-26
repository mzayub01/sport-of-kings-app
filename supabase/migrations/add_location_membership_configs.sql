-- Migration: Add location_membership_configs table
-- This replaces location-level capacity with (location + membership_type) level capacity

-- 1. Create the new configuration table
CREATE TABLE IF NOT EXISTS public.location_membership_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  membership_type_id uuid NOT NULL REFERENCES public.membership_types(id) ON DELETE CASCADE,
  capacity integer DEFAULT NULL, -- NULL = unlimited
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, membership_type_id)
);

-- 2. Add membership_type_id to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS membership_type_id uuid REFERENCES public.membership_types(id) ON DELETE CASCADE;

-- 3. Enable RLS
ALTER TABLE public.location_membership_configs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can view configs (needed for registration flow)
CREATE POLICY "Anyone can view location membership configs"
ON public.location_membership_configs FOR SELECT
USING (true);

-- Only admins can modify configs
CREATE POLICY "Admins can manage location membership configs"
ON public.location_membership_configs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Create helper function to get current member count for a combo
CREATE OR REPLACE FUNCTION get_membership_count(p_location_id uuid, p_membership_type_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.memberships
  WHERE location_id = p_location_id
    AND membership_type_id = p_membership_type_id
    AND status IN ('active', 'pending');
$$;

-- 6. Create function to check if a combo has capacity available
CREATE OR REPLACE FUNCTION has_capacity_available(p_location_id uuid, p_membership_type_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN lmc.capacity IS NULL THEN true -- unlimited
          WHEN lmc.capacity > get_membership_count(p_location_id, p_membership_type_id) THEN true
          ELSE false
        END
      FROM public.location_membership_configs lmc
      WHERE lmc.location_id = p_location_id AND lmc.membership_type_id = p_membership_type_id
    ),
    true -- If no config exists, assume unlimited
  );
$$;

-- 7. Remove deprecated columns from locations table
ALTER TABLE public.locations DROP COLUMN IF EXISTS max_capacity;
ALTER TABLE public.locations DROP COLUMN IF EXISTS current_members;
