-- Waitlist offer lifecycle: waiting -> offered (72h to pay) -> paid (row removed)
-- or expired (back of the queue, original join date kept).
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'waiting'; -- waiting | offered
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS offered_at timestamptz;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS offer_expires_at timestamptz;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS times_expired integer NOT NULL DEFAULT 0;

-- Preserve the original join date for existing entries
UPDATE public.waitlist SET joined_at = created_at WHERE created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_queue ON public.waitlist(location_id, membership_type_id, position);
CREATE INDEX IF NOT EXISTS idx_waitlist_offer_expiry ON public.waitlist(status, offer_expires_at);
