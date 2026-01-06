-- Create avatars storage bucket for profile images
-- Run this in Supabase SQL Editor

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to avatar images
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes to avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
