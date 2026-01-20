-- Add Payment Incomplete Email Template
-- Used for admin-triggered payment reminder emails

INSERT INTO email_templates (
    template_key, 
    name, 
    description, 
    subject, 
    greeting, 
    body_intro, 
    body_details, 
    body_action, 
    body_closing, 
    signature, 
    button_text, 
    button_url
) VALUES (
    'payment_incomplete',
    'Payment Incomplete Reminder',
    'Sent by admin to remind members to complete their payment',
    'Complete Your Sport of Kings Membership Payment',
    'Assalamu Alaikum {{firstName}},',
    'We noticed that your Sport of Kings account was created but your membership payment wasn''t completed. To access classes and start your training journey, please complete your payment.',
    '👤 **Account:** {{email}}
📍 **Location:** {{locationName}}
💳 **Status:** Payment Required',
    'Click the button below to complete your payment and activate your membership. Once payment is confirmed, you''ll have full access to classes at your location.',
    'If you have any questions or need assistance, please reply to this email or contact us at sportofkings786@gmail.com. We look forward to seeing you on the mats!',
    'The Sport of Kings Team',
    'Complete Payment',
    '{{paymentLink}}'
)
ON CONFLICT (template_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    subject = EXCLUDED.subject,
    greeting = EXCLUDED.greeting,
    body_intro = EXCLUDED.body_intro,
    body_details = EXCLUDED.body_details,
    body_action = EXCLUDED.body_action,
    body_closing = EXCLUDED.body_closing,
    signature = EXCLUDED.signature,
    button_text = EXCLUDED.button_text,
    button_url = EXCLUDED.button_url;
