-- Add membership_type_id to classes table
-- This allows classes to be restricted to specific membership tiers
-- If NULL, the class is open to all members at that location

ALTER TABLE public.classes 
ADD COLUMN membership_type_id uuid REFERENCES public.membership_types(id) ON DELETE SET NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.classes.membership_type_id IS 'If set, only members with this membership type can attend. If NULL, open to all members at the location.';
