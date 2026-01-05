import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { renderEventConfirmationEmail } from '@/lib/email-templates';
import { renderEmailFromDatabase } from '@/lib/email-templates-db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, firstName, eventTitle, eventDate, eventTime, eventLocation, amountPaid } = body;

        if (!email || !eventTitle) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Format date for display
        let formattedDate = eventDate;
        let formattedTime = eventTime || '';

        try {
            const dateObj = new Date(eventDate);
            formattedDate = dateObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            // If eventTime is provided as a time string (HH:MM), use it directly
            // Otherwise try to format from the date object
            if (!eventTime && eventDate.includes('T')) {
                formattedTime = dateObj.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
        } catch {
            // Keep original if parsing fails
        }

        // Try to get template from database first
        const dbTemplate = await renderEmailFromDatabase('event_confirmation', {
            firstName: firstName || 'Guest',
            eventTitle,
            eventDate: formattedDate,
            eventTime: formattedTime || 'TBC',
            eventLocation: eventLocation || 'TBC',
            ticketType: 'General Admission',
            amountPaid: amountPaid || 'Free',
        });

        let html: string;
        let subject: string;

        if (dbTemplate) {
            // Use database template
            html = dbTemplate.html;
            subject = dbTemplate.subject;
        } else {
            // Fallback to static template
            html = renderEventConfirmationEmail({
                firstName: firstName || 'Guest',
                eventTitle,
                eventDate: formattedDate,
                eventTime: formattedTime || 'TBC',
                eventLocation: eventLocation || 'TBC',
                amountPaid: amountPaid || 'Free',
            });
            subject = `Booking Confirmed: ${eventTitle}`;
        }

        // Send the email
        const result = await sendEmail({
            to: email,
            subject,
            html,
        });

        if (!result.success) {
            console.error('Failed to send event confirmation email:', result.error);
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Event confirmation email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send event confirmation email' },
            { status: 500 }
        );
    }
}
