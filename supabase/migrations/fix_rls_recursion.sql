-- ===============================================
-- Fix: RLS Infinite Recursion on Profiles Table
-- ===============================================
-- Run this in your Supabase SQL Editor to fix the 
-- "infinite recursion detected in policy" error

-- Step 1: Create a security definer function to check admin role
-- This bypasses RLS when checking the user's role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 2: Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Step 3: Recreate the admin policies using the security definer function
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Step 4: Also fix any other tables that have the same issue
-- (These tables have policies that check profiles table for admin role)

-- Fix locations table
DROP POLICY IF EXISTS "Admin can manage locations" ON public.locations;
CREATE POLICY "Admin can manage locations"
  ON public.locations FOR ALL
  USING (public.is_admin());

-- Fix membership_types table  
DROP POLICY IF EXISTS "Admin can manage membership types" ON public.membership_types;
CREATE POLICY "Admin can manage membership types"
  ON public.membership_types FOR ALL
  USING (public.is_admin());

-- Fix memberships table
DROP POLICY IF EXISTS "Admin can manage memberships" ON public.memberships;
CREATE POLICY "Admin can manage memberships"
  ON public.memberships FOR ALL
  USING (public.is_admin());

-- Fix waitlist table
DROP POLICY IF EXISTS "Admin can manage waitlist" ON public.waitlist;
CREATE POLICY "Admin can manage waitlist"
  ON public.waitlist FOR ALL
  USING (public.is_admin());

-- Fix instructors table
DROP POLICY IF EXISTS "Admin can manage instructors" ON public.instructors;
CREATE POLICY "Admin can manage instructors"
  ON public.instructors FOR ALL
  USING (public.is_admin());

-- Fix classes table  
DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;
CREATE POLICY "Admin can manage classes"
  ON public.classes FOR ALL
  USING (public.is_admin());

-- Fix attendance table
DROP POLICY IF EXISTS "Admin can manage attendance" ON public.attendance;
CREATE POLICY "Admin can manage attendance"
  ON public.attendance FOR ALL
  USING (public.is_admin());

-- Fix belt_progression table
DROP POLICY IF EXISTS "Admin can manage belt progression" ON public.belt_progression;
CREATE POLICY "Admin can manage belt progression"
  ON public.belt_progression FOR ALL
  USING (public.is_admin());

-- Fix videos table
DROP POLICY IF EXISTS "Admin can manage videos" ON public.videos;
CREATE POLICY "Admin can manage videos"
  ON public.videos FOR ALL
  USING (public.is_admin());

-- Fix events table
DROP POLICY IF EXISTS "Admin can manage events" ON public.events;
CREATE POLICY "Admin can manage events"
  ON public.events FOR ALL
  USING (public.is_admin());

-- Fix event_rsvps table
DROP POLICY IF EXISTS "Admin can manage RSVPs" ON public.event_rsvps;
CREATE POLICY "Admin can manage RSVPs"
  ON public.event_rsvps FOR ALL
  USING (public.is_admin());

-- Fix announcements table
DROP POLICY IF EXISTS "Admin can manage announcements" ON public.announcements;
CREATE POLICY "Admin can manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- Fix naseeha table
DROP POLICY IF EXISTS "Admin can manage naseeha" ON public.naseeha;
CREATE POLICY "Admin can manage naseeha"
  ON public.naseeha FOR ALL
  USING (public.is_admin());

-- ===============================================
-- Verification: After running this, test with:
-- SELECT public.is_admin();
-- (Should return true/false without recursion error)
-- ===============================================
