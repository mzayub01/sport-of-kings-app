-- Add Announcement Notification Email Template
-- This template is used when sending email notifications for new announcements

INSERT INTO email_templates (template_key, name, description, subject, greeting, body_intro, body_details, body_action, body_closing, signature, button_text, button_url) VALUES
('announcement_notification', 'Announcement Notification', 'Sent to members when a new announcement is posted',
'📢 {{announcementTitle}}',
'Assalamu Alaikum {{firstName}},',
'We have an important announcement to share with you:',
'**{{announcementTitle}}**

{{announcementMessage}}',
NULL,
'Please check the dashboard for more details and updates.',
'The Sport of Kings Team',
'View Dashboard',
'https://sportofkings.info/dashboard')
ON CONFLICT (template_key) DO NOTHING;
