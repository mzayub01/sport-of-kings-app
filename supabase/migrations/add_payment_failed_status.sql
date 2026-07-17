-- Add 'payment_failed' to the membership_status enum.
-- The Stripe webhook sets this after 3 failed recurring payment attempts;
-- without this value the update errors and failed payments never flag the membership.
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'payment_failed';
