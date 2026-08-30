import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { renderGettingStartedEmail, type GettingStartedMembership } from '@/lib/email-templates/getting-started';
import { ukDateString, ukDayOfWeek, ukMinutesOfDay, timeToMinutes } from '@/lib/dates';

const GI_FORM_URL = 'https://forms.gle/wHZrRHyCyLUcqKTD8';
const DAY_PLURALS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

/** "19:00:00" → "7:00 pm" */
function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "2026-12-07" → "Sunday 7th December 2026" */
function formatLongDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? 'st'
        : day % 10 === 2 && day !== 12 ? 'nd'
            : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    return `${weekday} ${day}${suffix} ${month} ${d.getFullYear()}`;
}

/** Next occurrence (YYYY-MM-DD) of a class from now, in UK time. */
function nextClassDate(dayOfWeek: number, startTime: string): string {
    const todayDow = ukDayOfWeek();
    let daysAhead = (dayOfWeek - todayDow + 7) % 7;
    if (daysAhead === 0 && timeToMinutes(startTime) <= ukMinutesOfDay()) daysAhead = 7;
    const today = new Date(ukDateString() + 'T12:00:00');
    today.setDate(today.getDate() + daysAhead);
    return today.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Admin only
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('user_id', user.id)
            .single();
        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const admin = await createAdminClient();

        // Member profile (children: email the parent, greet the parent, name the child)
        const { data: profile } = await admin
            .from('profiles')
            .select('id, first_name, last_name, email, is_child, parent_guardian_id')
            .eq('user_id', userId)
            .single();
        if (!profile) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        let recipientEmail: string | null = profile.email;
        let greetingName: string = profile.first_name;
        let memberName: string | null = null;

        if (profile.is_child && profile.parent_guardian_id) {
            const { data: parent } = await admin
                .from('profiles')
                .select('first_name, email')
                .eq('id', profile.parent_guardian_id)
                .single();
            if (parent?.email) {
                recipientEmail = parent.email;
                greetingName = parent.first_name;
                memberName = `${profile.first_name} ${profile.last_name}`;
            }
        }

        if (!recipientEmail) {
            return NextResponse.json({ error: 'No email address on file for this member' }, { status: 400 });
        }

        // Their memberships (active or awaiting payment)
        const { data: memberships } = await admin
            .from('memberships')
            .select('location_id, membership_type_id, status, location:locations(name), membership_type:membership_types(name)')
            .eq('user_id', userId)
            .in('status', ['active', 'pending']);

        if (!memberships || memberships.length === 0) {
            return NextResponse.json({ error: 'This member has no active or pending membership to reference' }, { status: 400 });
        }

        // Allocated classes per membership: classes at the location whose tiers
        // include the membership type (classes with no tiers are open to all)
        const rendered: GettingStartedMembership[] = [];
        const candidateDates: string[] = [];

        for (const m of memberships as any[]) {
            const { data: classes } = await admin
                .from('classes')
                .select('name, day_of_week, start_time, end_time, class_membership_types(membership_type_id)')
                .eq('location_id', m.location_id)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');

            const allocated = (classes || []).filter((c: any) => {
                const tiers = (c.class_membership_types || []).map((t: any) => t.membership_type_id);
                return tiers.length === 0 || (m.membership_type_id && tiers.includes(m.membership_type_id));
            });

            allocated.forEach((c: any) => candidateDates.push(nextClassDate(c.day_of_week, c.start_time)));

            rendered.push({
                memberName,
                membershipType: m.membership_type?.name || 'Membership',
                locationName: m.location?.name || 'Sport of Kings',
                classes: allocated.map((c: any) => ({
                    name: c.name,
                    dayLabel: DAY_PLURALS[c.day_of_week],
                    timeLabel: `${formatTime(c.start_time)} - ${formatTime(c.end_time)}`,
                })),
            });
        }

        const firstClassDate = candidateDates.length > 0
            ? formatLongDate(candidateDates.sort()[0])
            : null;
        const locationName = rendered[0].locationName;

        const html = renderGettingStartedEmail({
            firstName: greetingName,
            locationName,
            memberships: rendered,
            firstClassDate,
            giFormUrl: GI_FORM_URL,
        });

        const result = await sendEmail({
            to: recipientEmail,
            subject: `Welcome to Sport of Kings BJJ at ${locationName} — Getting Started`,
            html,
            replyTo: 'sportofkings786@gmail.com',
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
        }

        const sentByName = `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || null;
        const { data: logRow } = await admin
            .from('member_email_log')
            .insert({
                user_id: userId,
                email_type: 'getting_started',
                sent_to: recipientEmail,
                sent_by: user.id,
                sent_by_name: sentByName,
            })
            .select('sent_at, sent_by_name, sent_to')
            .single();

        console.log(`Getting-started email sent to ${recipientEmail} (member ${userId}) by admin ${user.id}`);
        return NextResponse.json({
            success: true,
            message: `Getting started email sent to ${recipientEmail}`,
            log: logRow || { sent_at: new Date().toISOString(), sent_by_name: sentByName, sent_to: recipientEmail },
        });
    } catch (error) {
        console.error('Error sending getting-started email:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send email' },
            { status: 500 }
        );
    }
}
