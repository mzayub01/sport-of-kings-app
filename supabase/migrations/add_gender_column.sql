-- Add gender enum and column to profiles table
-- Run this in Supabase SQL Editor

-- Create enum type for gender
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add gender column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender gender_type;
