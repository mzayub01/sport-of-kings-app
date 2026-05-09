import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

/**
 * Render a custom message into the Sport of Kings branded email layout.
 * This mirrors the layout in email-templates-db.ts but accepts freeform content.
 */
function renderCustomEmailHtml(options: {
    subject: string;
    recipientName: string;
    message: string;
    eventTitle: string;
    logoUrl?: string;
}): string {
    const {
        subject,
        recipientName,
        message,
        eventTitle,
        logoUrl = 'https://sportofkings.info/logo-full.png',
    } = options;

    // Convert line breaks to <br> for HTML
    const htmlMessage = message.replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; max-width: 600px;">
                    <!-- Main Card -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                            <!-- Logo -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center; padding-bottom: 24px;">
                                        <img src="${logoUrl}" alt="Sport of Kings" height="60" style="height: 60px; width: auto;">
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Event Badge -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <span style="display: inline-block; background: linear-gradient(135deg, #c5a456, #a68935); color: #000; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 20px;">
                                            ${eventTitle}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Heading -->
                            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center; margin: 0 0 24px;">
                                ${subject}
                            </h1>
                            
                            <!-- Greeting -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px;">
                                Assalamu Alaikum ${recipientName},
                            </p>
                            
                            <!-- Message Body -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 24px;">
                                ${htmlMessage}
                            </p>
                            
                            <!-- Signature -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0;">
                                JazakAllahu Khayran,<br>
                                <strong>The Sport of Kings Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 24px; text-align: center;">
                            <p style="font-size: 14px; color: #888888; margin: 0 0 4px;">
                                Sport of Kings - Seerat Un Nabi
                            </p>
                            <p style="font-size: 14px; color: #888888; margin: 0 0 8px;">
                                Brazilian Jiu-Jitsu Classes in Manchester
                            </p>
                            <a href="https://sportofkings.info" style="font-size: 14px; color: #c5a456; text-decoration: none;">
                                Visit our website
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

export async function POST(request: NextRequest) {
    try {
        // Verify the requester is an admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { eventId, subject, message } = body;

        if (!eventId || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields: eventId, subject, message' }, { status: 400 });
        }

        // Use service role client to bypass RLS
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Fetch the event details for context
        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('id, title')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Fetch all RSVPs for the event
        const { data: rsvps, error: rsvpsError } = await supabaseAdmin
            .from('event_rsvps')
            .select('id, full_name, email')
            .eq('event_id', eventId);

        if (rsvpsError) {
            console.error('Error fetching RSVPs:', rsvpsError);
            return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
        }

        if (!rsvps || rsvps.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                failed: 0,
                total: 0,
                message: 'No attendees found for this event',
            });
        }

        // Deduplicate by email
        const emailMap = new Map<string, { fullName: string; email: string }>();
        for (const rsvp of rsvps) {
            if (rsvp.email && !emailMap.has(rsvp.email)) {
                emailMap.set(rsvp.email, {
                    fullName: rsvp.full_name || 'there',
                    email: rsvp.email,
                });
            }
        }

        const recipients = Array.from(emailMap.values());

        // Send emails
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const recipient of recipients) {
            try {
                const firstName = recipient.fullName.split(' ')[0] || recipient.fullName;

                const html = renderCustomEmailHtml({
                    subject,
                    recipientName: firstName,
                    message,
                    eventTitle: event.title,
                });

                const result = await sendEmail({
                    to: recipient.email,
                    subject,
                    html,
                });

                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    errors.push(`${recipient.email}: ${result.error}`);
                }

                // Small delay to avoid rate limits (Resend allows 10/sec on free tier)
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (err) {
                failed++;
                errors.push(`${recipient.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            sent,
            failed,
            total: recipients.length,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
        });

    } catch (error) {
        console.error('Event attendee email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send event emails' },
            { status: 500 }
        );
    }
}
