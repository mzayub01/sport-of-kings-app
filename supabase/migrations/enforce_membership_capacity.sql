-- Enforce (location + membership type) capacity at the database level.
--
-- Previously capacity was only checked in the browser with counts loaded when
-- the registration page opened, and the paid path created no membership row
-- until the Stripe webhook fired — so nothing reserved a place between the
-- check and the payment, and several paths (add-child, dashboard checkout,
-- admin add) never checked at all. This trigger makes every path atomic.

-- 1. Remove the legacy per-location counter trigger, which referenced the
--    locations.current_members column dropped by add_location_membership_configs
DROP TRIGGER IF EXISTS update_member_count ON public.memberships;
DROP FUNCTION IF EXISTS update_location_member_count();

-- 2. has_capacity_available now also honours is_available = false
CREATE OR REPLACE FUNCTION has_capacity_available(p_location_id uuid, p_membership_type_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE
          WHEN lmc.is_available = false THEN false
          WHEN lmc.capacity IS NULL THEN true -- unlimited
          WHEN lmc.capacity > get_membership_count(p_location_id, p_membership_type_id) THEN true
          ELSE false
        END
      FROM public.location_membership_configs lmc
      WHERE lmc.location_id = p_location_id AND lmc.membership_type_id = p_membership_type_id
    ),
    true -- no config = unlimited
  );
$$;

-- 3. Trigger: block a membership from ENTERING the counted set (active/pending)
--    when the combo is full. Rows already counted may change other fields freely.
CREATE OR REPLACE FUNCTION enforce_membership_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  entering boolean;
BEGIN
  IF NEW.membership_type_id IS NULL OR NEW.status NOT IN ('active', 'pending') THEN
    RETURN NEW;
  END IF;

  entering := TG_OP = 'INSERT'
    OR OLD.status NOT IN ('active', 'pending')
    OR OLD.location_id <> NEW.location_id
    OR OLD.membership_type_id IS DISTINCT FROM NEW.membership_type_id;

  IF entering AND NOT has_capacity_available(NEW.location_id, NEW.membership_type_id) THEN
    RAISE EXCEPTION 'MEMBERSHIP_TYPE_FULL: this membership type is at capacity at this location'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_membership_capacity ON public.memberships;
CREATE TRIGGER enforce_membership_capacity
  BEFORE INSERT OR UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION enforce_membership_capacity();
