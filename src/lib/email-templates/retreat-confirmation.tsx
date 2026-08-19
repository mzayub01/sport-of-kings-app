import * as React from 'react';
import { Text, Hr } from '@react-email/components';
import { BaseEmailLayout, baseStyles } from './base-layout';

interface RetreatConfirmationEmailProps {
    firstName: string;
    partySummary: string; // e.g. "2 adults, 1 child (10–15)"
    amountPaid: string;   // e.g. "£1,150"
    dates: string;
    location: string;
}

export function RetreatConfirmationEmail({
    firstName,
    partySummary,
    amountPaid,
    dates,
    location,
}: RetreatConfirmationEmailProps) {
    return (
        <BaseEmailLayout previewText="Your place on the Suhba Retreat 2026 is confirmed!">
            <Text style={baseStyles.heading}>
                Your Retreat Place is Confirmed! 🏔️
            </Text>

            <Text style={baseStyles.text}>
                Assalamu Alaikum {firstName},
            </Text>

            <Text style={baseStyles.text}>
                Alhamdulillah — your registration for the <strong>Suhba Retreat 2026</strong> is
                confirmed and your payment has been received. We can&apos;t wait to share this
                journey with you.
            </Text>

            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />

            <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
            }}>
                <Text style={{ ...baseStyles.text, margin: '0 0 12px', fontWeight: '600' }}>
                    Booking Details:
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📅 <strong>Dates:</strong> {dates}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📍 <strong>Location:</strong> {location}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    👥 <strong>Party:</strong> {partySummary}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0' }}>
                    💳 <strong>Amount Paid:</strong> {amountPaid}
                </Text>
            </div>

            <Text style={baseStyles.text}>
                <strong>What happens next?</strong> We&apos;ll be in touch with the full itinerary,
                venue details and travel guidance closer to the time. Flights are not included —
                we recommend booking Manchester → Marrakech early while prices are low.
            </Text>

            <Text style={baseStyles.text}>
                If you have any questions in the meantime, just reply to this email.
            </Text>

            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

/**
 * Render retreat confirmation email to HTML string
 */
export function renderRetreatConfirmationEmail(props: RetreatConfirmationEmailProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<RetreatConfirmationEmail {...props} />);
}
