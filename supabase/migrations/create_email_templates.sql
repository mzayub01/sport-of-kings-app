-- Email Templates Table
-- Stores editable email template content for admin management

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    greeting TEXT NOT NULL,
    body_intro TEXT NOT NULL,
    body_details TEXT,
    body_action TEXT,
    body_closing TEXT NOT NULL,
    signature TEXT NOT NULL DEFAULT 'The Sport of Kings Team',
    button_text VARCHAR(100),
    button_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert default templates
INSERT INTO email_templates (template_key, name, description, subject, greeting, body_intro, body_details, body_action, body_closing, signature, button_text, button_url) VALUES

-- Welcome Email
('welcome', 'Welcome Email', 'Sent to new members after registration', 
'Welcome to Sport of Kings, {{firstName}}!',
'Assalamu Alaikum {{firstName}},',
'We''re thrilled to welcome you to our martial arts family! Your registration at {{locationName}} has been successfully completed.',
'📍 **Location:** {{locationName}}
🏷️ **Membership:** {{membershipType}}',
'Before your first class, please remember to:
✅ Bring a clean Gi (uniform)
✅ Trim your finger and toe nails
✅ Arrive 10 minutes early
✅ Bring water and a positive attitude!',
'If you have any questions, please don''t hesitate to reach out to us. See you on the mats!',
'The Sport of Kings Team',
'Go to Dashboard',
'https://sport-of-kings-iota.vercel.app/dashboard'),

-- Event Confirmation Email
('event_confirmation', 'Event Confirmation', 'Sent after event booking/payment',
'Booking Confirmed: {{eventTitle}}',
'Assalamu Alaikum {{firstName}},',
'Great news! Your booking for **{{eventTitle}}** has been confirmed.',
'📅 **Date:** {{eventDate}}
🕐 **Time:** {{eventTime}}
📍 **Location:** {{eventLocation}}
🎫 **Ticket:** {{ticketType}}
💳 **Amount Paid:** {{amountPaid}}',
'Please arrive at least 15 minutes before the event starts.',
'We look forward to seeing you there!',
'The Sport of Kings Team',
'View Event Details',
'https://sport-of-kings-iota.vercel.app/events'),

-- Membership Activated Email
('membership_activated', 'Membership Activated', 'Sent after successful Stripe payment',
'Your Sport of Kings Membership is Now Active!',
'Assalamu Alaikum {{firstName}},',
'Your payment has been processed successfully and your membership is now active!',
'📍 **Location:** {{locationName}}
🏷️ **Plan:** {{membershipType}}
💳 **Monthly:** {{price}}
📅 **Started:** {{startDate}}',
'Your subscription will automatically renew each month. You can manage your membership at any time from your dashboard.',
'Thank you for joining our martial arts community!',
'The Sport of Kings Team',
'Go to Dashboard',
'https://sport-of-kings-iota.vercel.app/dashboard'),

-- Payment Failed Email
('payment_failed', 'Payment Failed', 'Sent when subscription payment fails',
'Action Required: Payment Failed for Your Membership',
'Assalamu Alaikum {{firstName}},',
'We were unable to process your payment for your **{{membershipType}}** membership.',
'💳 **Amount Due:** {{amountDue}}
🔄 **Attempt:** {{attemptCount}} of 3
📅 **Next Attempt:** {{nextAttemptDate}}',
'Please update your payment method to avoid any interruption to your membership.',
'If you have any questions or need assistance, please don''t hesitate to contact us.',
'The Sport of Kings Team',
'Update Payment Method',
'https://sport-of-kings-iota.vercel.app/dashboard/membership')

ON CONFLICT (template_key) DO NOTHING;

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage templates
CREATE POLICY "Admins can manage email templates"
ON email_templates
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Grant access
GRANT ALL ON email_templates TO authenticated;
