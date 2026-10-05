-- Retreat passport collection: private storage, upload records, hotel access
-- links and an access log.
--
-- Everything here is reachable ONLY through server API routes using the
-- service role. RLS is enabled with no policies on purpose, and the storage
-- bucket is private with no storage.objects policies, so no browser client
-- (member, admin or anonymous) can read these rows or files directly.

-- 1. Private bucket (5 MB per file, images and PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'retreat-passports',
  'retreat-passports',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. One row per uploaded passport
CREATE TABLE IF NOT EXISTS public.retreat_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_year int NOT NULL DEFAULT 2026,
  -- NULL registration = "couldn't find my booking" upload awaiting assignment
  registration_id uuid REFERENCES public.retreat_registrations(id) ON DELETE CASCADE,
  attendee_index int,            -- position in retreat_registrations.attendees
  attendee_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes int,
  uploader_note text,            -- name/contact typed on an unmatched upload
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- One passport per attendee slot; a re-upload replaces it
CREATE UNIQUE INDEX IF NOT EXISTS retreat_passports_slot
  ON public.retreat_passports (registration_id, attendee_index)
  WHERE registration_id IS NOT NULL;

ALTER TABLE public.retreat_passports ENABLE ROW LEVEL SECURITY;

-- 3. Hotel access links (token and passcode are stored hashed)
CREATE TABLE IF NOT EXISTS public.retreat_hotel_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_year int NOT NULL DEFAULT 2026,
  label text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  passcode_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.retreat_hotel_access ENABLE ROW LEVEL SECURITY;

-- 4. Audit log of everything done through a hotel link
CREATE TABLE IF NOT EXISTS public.retreat_passport_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id uuid NOT NULL REFERENCES public.retreat_hotel_access(id) ON DELETE CASCADE,
  action text NOT NULL,          -- open | view | download_all | failed_passcode
  passport_id uuid,
  passport_name text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retreat_passport_log_access
  ON public.retreat_passport_access_log (access_id, created_at DESC);

ALTER TABLE public.retreat_passport_access_log ENABLE ROW LEVEL SECURITY;

-- 5. Attempt counter used to rate-limit booking lookups, uploads and passcodes
CREATE TABLE IF NOT EXISTS public.retreat_passport_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retreat_passport_attempts
  ON public.retreat_passport_attempts (key_hash, kind, created_at DESC);

ALTER TABLE public.retreat_passport_attempts ENABLE ROW LEVEL SECURITY;
