import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { renderWelcomeEmail } from '@/lib/email-templates';
import { renderEmailFromDatabase } from '@/lib/email-templates-db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, firstName, locationName, membershipType } = body;

        if (!email || !firstName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Try to get template from database first
        const dbTemplate = await renderEmailFromDatabase('welcome', {
            firstName,
            locationName: locationName || 'Sport of Kings',
            membershipType: membershipType || 'Member',
        });

        let html: string;
        let subject: string;

        if (dbTemplate) {
            // Use database template
            html = dbTemplate.html;
            subject = dbTemplate.subject;
        } else {
            // Fallback to static template
            html = renderWelcomeEmail({
                firstName,
                locationName: locationName || 'Sport of Kings',
                membershipType: membershipType || 'Member',
            });
            subject = `Welcome to Sport of Kings, ${firstName}!`;
        }

        // Send the email
        const result = await sendEmail({
            to: email,
            subject,
            html,
        });

        if (!result.success) {
            console.error('Failed to send welcome email:', result.error);
            // Don't fail the registration if email fails
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Welcome email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send welcome email' },
            { status: 500 }
        );
    }
}
