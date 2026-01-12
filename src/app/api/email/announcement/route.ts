import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { renderEmailFromDatabase } from '@/lib/email-templates-db';

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
        const { announcementTitle, announcementMessage, locationId, targetAudience } = body;

        if (!announcementTitle || !announcementMessage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use service role client to fetch all members
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Build query to get members
        // Start with active memberships
        let query = supabaseAdmin
            .from('memberships')
            .select('user_id, profile:profiles!inner(first_name, email, role, is_child)')
            .eq('status', 'active');

        // Filter by location if specified
        if (locationId) {
            query = query.eq('location_id', locationId);
        }

        const { data: memberships, error: membershipsError } = await query;

        if (membershipsError) {
            console.error('Error fetching memberships:', membershipsError);
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
        }

        // Filter by target audience and remove duplicates (one member might have multiple memberships)
        const emailMap = new Map<string, { firstName: string; email: string }>();

        for (const membership of memberships || []) {
            // Profile can be an object or array depending on the query
            const profileData = membership.profile as unknown;
            const profile = (Array.isArray(profileData) ? profileData[0] : profileData) as {
                first_name: string;
                email: string;
                role: string;
                is_child: boolean
            } | null;

            if (!profile) continue;

            // Skip child profiles (they don't have real emails)
            if (profile.is_child) continue;

            // Skip if email looks like a child placeholder
            if (profile.email.includes('@child.sport-of-kings.local')) continue;

            // Filter by target audience
            if (targetAudience === 'members' && profile.role !== 'member') continue;
            if (targetAudience === 'instructors' && profile.role !== 'instructor') continue;
            // 'all' includes everyone

            // Use Map to deduplicate by email
            if (!emailMap.has(profile.email)) {
                emailMap.set(profile.email, {
                    firstName: profile.first_name,
                    email: profile.email,
                });
            }
        }

        const recipients = Array.from(emailMap.values());

        if (recipients.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No matching recipients found',
            });
        }

        // Send emails
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const recipient of recipients) {
            try {
                // Render the email template
                const templateData = {
                    firstName: recipient.firstName,
                    announcementTitle,
                    announcementMessage: announcementMessage.replace(/\n/g, '<br>'),
                };

                const emailContent = await renderEmailFromDatabase('announcement_notification', templateData);

                if (!emailContent) {
                    // Fallback if template not in database
                    const fallbackSubject = `📢 ${announcementTitle}`;
                    const fallbackHtml = `
                        <p>Assalamu Alaikum ${recipient.firstName},</p>
                        <p>We have an important announcement:</p>
                        <h2>${announcementTitle}</h2>
                        <p>${announcementMessage.replace(/\n/g, '<br>')}</p>
                        <p>JazakAllahu Khayran,<br>The Sport of Kings Team</p>
                    `;
                    const result = await sendEmail({
                        to: recipient.email,
                        subject: fallbackSubject,
                        html: fallbackHtml,
                    });

                    if (result.success) {
                        sent++;
                    } else {
                        failed++;
                        errors.push(`${recipient.email}: ${result.error}`);
                    }
                } else {
                    const result = await sendEmail({
                        to: recipient.email,
                        subject: emailContent.subject,
                        html: emailContent.html,
                    });

                    if (result.success) {
                        sent++;
                    } else {
                        failed++;
                        errors.push(`${recipient.email}: ${result.error}`);
                    }
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
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Only return first 5 errors
        });

    } catch (error) {
        console.error('Announcement email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send announcement emails' },
            { status: 500 }
        );
    }
}
