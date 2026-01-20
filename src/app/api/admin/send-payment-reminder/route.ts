import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { renderEmailFromDatabase } from '@/lib/email-templates-db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, firstName, locationName } = body;

        if (!userId || !email) {
            return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
        }

        // Use session-aware client to get the logged-in user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Generate the payment link (link to membership page where they can complete payment)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sportofkings.info';
        const paymentLink = `${baseUrl}/dashboard/membership`;

        // Render the email template
        const emailData = {
            firstName: firstName || 'Member',
            email: email,
            locationName: locationName || 'your preferred location',
            paymentLink: paymentLink,
        };

        const rendered = await renderEmailFromDatabase('payment_incomplete', emailData);

        if (!rendered) {
            return NextResponse.json({
                error: 'Email template not found. Please run the migration to add the payment_incomplete template.'
            }, { status: 500 });
        }

        // Send the email
        const result = await sendEmail({
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            replyTo: 'sportofkings786@gmail.com',
        });

        if (!result.success) {
            return NextResponse.json({
                error: result.error || 'Failed to send email'
            }, { status: 500 });
        }

        // Log the reminder sent
        console.log(`Payment reminder sent to ${email} (user: ${userId}) by admin ${user.id}`);

        return NextResponse.json({
            success: true,
            message: `Payment reminder sent to ${email}`
        });

    } catch (error) {
        console.error('Error sending payment reminder:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to send payment reminder'
        }, { status: 500 });
    }
}
