-- Add payment tracking columns to event_rsvps table
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN event_rsvps.payment_status IS 'Payment status: pending, paid, refunded';
COMMENT ON COLUMN event_rsvps.stripe_payment_id IS 'Stripe PaymentIntent ID for paid events';
