import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { BaseEmailLayout, baseStyles } from './base-layout';

interface PaymentFailedEmailProps {
    firstName: string;
    membershipType: string;
    amountDue: string;
    attemptCount: number;
    nextAttemptDate?: string;
    updatePaymentUrl?: string;
}

export function PaymentFailedEmail({
    firstName,
    membershipType,
    amountDue,
    attemptCount,
    nextAttemptDate,
    updatePaymentUrl = 'https://sport-of-kings-iota.vercel.app/dashboard/membership',
}: PaymentFailedEmailProps) {
    const isLastAttempt = attemptCount >= 3;

    return (
        <BaseEmailLayout previewText={`Action required: Payment failed for your ${membershipType} membership`}>
            <Text style={baseStyles.heading}>
                Payment Failed ⚠️
            </Text>

            <Text style={baseStyles.text}>
                Assalamu Alaikum {firstName},
            </Text>

            <Text style={baseStyles.text}>
                We were unable to process your payment for your <strong>{membershipType}</strong> membership.
            </Text>

            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />

            <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #fecaca',
            }}>
                <Text style={{ ...baseStyles.text, margin: '0 0 12px', fontWeight: '600', color: '#991b1b' }}>
                    Payment Details:
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    💳 <strong>Amount Due:</strong> {amountDue}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    🔄 <strong>Attempt:</strong> {attemptCount} of 3
                </Text>
                {nextAttemptDate && !isLastAttempt && (
                    <Text style={{ ...baseStyles.text, margin: '0' }}>
                        📅 <strong>Next Attempt:</strong> {nextAttemptDate}
                    </Text>
                )}
            </div>

            {isLastAttempt ? (
                <Text style={{ ...baseStyles.text, color: '#991b1b', fontWeight: '600' }}>
                    ⚠️ This was our final attempt. Your membership has been suspended. Please update your payment method to reactivate.
                </Text>
            ) : (
                <Text style={baseStyles.text}>
                    Please update your payment method to avoid any interruption to your membership. We will automatically retry the payment on {nextAttemptDate}.
                </Text>
            )}

            <div style={baseStyles.buttonContainer}>
                <Link href={updatePaymentUrl} style={{
                    ...baseStyles.button,
                    backgroundColor: isLastAttempt ? '#dc2626' : '#c5a456',
                    color: '#ffffff',
                }}>
                    Update Payment Method
                </Link>
            </div>

            <Text style={baseStyles.text}>
                If you have any questions or need assistance, please don't hesitate to contact us.
            </Text>

            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

/**
 * Render payment failed email to HTML string
 */
export function renderPaymentFailedEmail(props: PaymentFailedEmailProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<PaymentFailedEmail {...props} />);
}
