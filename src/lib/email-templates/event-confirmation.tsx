import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { BaseEmailLayout, baseStyles } from './base-layout';

interface EventConfirmationEmailProps {
    firstName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketType?: string;
    amountPaid?: string;
    eventUrl?: string;
}

export function EventConfirmationEmail({
    firstName,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    ticketType,
    amountPaid,
    eventUrl = 'https://sportofkings.info/events',
}: EventConfirmationEmailProps) {
    return (
        <BaseEmailLayout previewText={`Your booking for ${eventTitle} is confirmed!`}>
            <Text style={baseStyles.heading}>
                Event Booking Confirmed! 🎉
            </Text>

            <Text style={baseStyles.text}>
                Assalamu Alaikum {firstName},
            </Text>

            <Text style={baseStyles.text}>
                Great news! Your booking for <strong>{eventTitle}</strong> has been confirmed.
            </Text>

            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />

            <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
            }}>
                <Text style={{ ...baseStyles.text, margin: '0 0 12px', fontWeight: '600' }}>
                    Event Details:
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📅 <strong>Date:</strong> {eventDate}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    🕐 <strong>Time:</strong> {eventTime}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📍 <strong>Location:</strong> {eventLocation}
                </Text>
                {ticketType && (
                    <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                        🎫 <strong>Ticket:</strong> {ticketType}
                    </Text>
                )}
                {amountPaid && (
                    <Text style={{ ...baseStyles.text, margin: '0' }}>
                        💳 <strong>Amount Paid:</strong> {amountPaid}
                    </Text>
                )}
            </div>

            <div style={baseStyles.buttonContainer}>
                <Link href={eventUrl} style={baseStyles.button}>
                    View Event Details
                </Link>
            </div>

            <Text style={baseStyles.text}>
                Please arrive at least 15 minutes before the event starts. We look forward to seeing you there!
            </Text>

            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

/**
 * Render event confirmation email to HTML string
 */
export function renderEventConfirmationEmail(props: EventConfirmationEmailProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<EventConfirmationEmail {...props} />);
}
