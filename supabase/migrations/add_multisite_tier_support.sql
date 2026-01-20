-- ===============================================
-- Multisite Membership Tier Support
-- Adds is_multisite flag to membership_types to distinguish
-- multisite add-on tiers from primary membership tiers
-- ===============================================

-- Add is_multisite flag to membership_types
ALTER TABLE public.membership_types 
  ADD COLUMN IF NOT EXISTS is_multisite boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.membership_types.is_multisite IS 'True for multisite add-on tiers that can be purchased as secondary memberships, false for primary membership tiers';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_membership_types_is_multisite ON public.membership_types(is_multisite) WHERE is_multisite = true;
