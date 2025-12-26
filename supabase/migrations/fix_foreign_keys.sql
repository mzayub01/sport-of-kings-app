-- ===============================================
-- Fix: Missing Foreign Keys and Schema Issues
-- ===============================================
-- Run this in your Supabase SQL Editor to fix the 
-- 400 Bad Request errors when fetching related data

-- 1. Check if foreign keys exist and add them if missing

-- Classes -> Locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'classes_location_id_fkey' AND table_name = 'classes'
  ) THEN
    ALTER TABLE public.classes 
      ADD CONSTRAINT classes_location_id_fkey 
      FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Classes -> Instructors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'classes_instructor_id_fkey' AND table_name = 'classes'
  ) THEN
    ALTER TABLE public.classes 
      ADD CONSTRAINT classes_instructor_id_fkey 
      FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Instructors -> Profiles (user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'instructors_user_id_fkey' AND table_name = 'instructors'
  ) THEN
    ALTER TABLE public.instructors 
      ADD CONSTRAINT instructors_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add is_active column to classes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- 3. Set all existing classes to is_active = true
UPDATE public.classes SET is_active = true WHERE is_active IS NULL;

-- ===============================================
-- Verification: Run these to check the fixes worked
-- ===============================================
-- SELECT * FROM public.classes LIMIT 5;
-- SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
-- WHERE tc.table_name = 'classes' AND tc.constraint_type = 'FOREIGN KEY';
