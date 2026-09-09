import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { BaseEmailLayout, baseStyles } from './base-layout';

const box = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '24px' };

// ---------------------------------------------------------------------------
// 1. Joined the waitlist
// ---------------------------------------------------------------------------
interface WaitlistJoinedProps {
    firstName: string;
    memberName?: string | null; // when the place is for a child
    locationName: string;
    membershipType: string;
    position: number;
}

export function WaitlistJoinedEmail({ firstName, memberName, locationName, membershipType, position }: WaitlistJoinedProps) {
    return (
        <BaseEmailLayout previewText={`You're #${position} on the waitlist for ${membershipType} at ${locationName}`}>
            <Text style={baseStyles.heading}>You&apos;re on the waitlist</Text>
            <Text style={baseStyles.text}>Assalamu Alaikum {firstName},</Text>
            <Text style={baseStyles.text}>
                Thank you for registering with Sport of Kings. The <strong>{membershipType}</strong> membership at{' '}
                <strong>{locationName}</strong> is currently full, so {memberName ? `${memberName} has` : 'you have'} been
                added to the waiting list.
            </Text>
            <div style={box}>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📍 <strong>Location:</strong> {locationName}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    🥋 <strong>Membership:</strong> {membershipType}
                </Text>
                <Text style={{ ...baseStyles.text, margin: 0 }}>
                    🔢 <strong>Position in queue:</strong> #{position}
                </Text>
            </div>
            <Text style={baseStyles.text}>
                <strong>What happens next?</strong> As soon as a place opens up, we&apos;ll email you an offer with a
                link to complete payment. You&apos;ll have <strong>72 hours</strong> to accept — if the time runs out,
                you&apos;ll keep your registration but move to the back of the queue. No payment is taken until you accept.
            </Text>
            <Text style={baseStyles.text}>
                You can check your position any time on your{' '}
                <Link href="https://sportofkings.info/dashboard" style={{ color: '#C5A456', fontWeight: '600' }}>dashboard</Link>.
            </Text>
            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

// ---------------------------------------------------------------------------
// 2. Place offered (and 24h reminder)
// ---------------------------------------------------------------------------
interface WaitlistOfferProps {
    firstName: string;
    memberName?: string | null;
    locationName: string;
    membershipType: string;
    priceLabel: string;      // e.g. "£35/month"
    expiresLabel: string;    // e.g. "Thursday 12 September, 3:00 pm"
    payUrl: string;
    isReminder?: boolean;
}

export function WaitlistOfferEmail({ firstName, memberName, locationName, membershipType, priceLabel, expiresLabel, payUrl, isReminder }: WaitlistOfferProps) {
    return (
        <BaseEmailLayout previewText={isReminder
            ? `Reminder: your place at ${locationName} expires ${expiresLabel}`
            : `A place has opened up for you at ${locationName}!`}>
            <Text style={baseStyles.heading}>
                {isReminder ? 'Reminder: your place expires soon ⏳' : 'A place has opened up for you! 🎉'}
            </Text>
            <Text style={baseStyles.text}>Assalamu Alaikum {firstName},</Text>
            <Text style={baseStyles.text}>
                {isReminder
                    ? <>Just a reminder that the place we offered {memberName ? `for ${memberName}` : 'you'} is still waiting — but not for long.</>
                    : <>Great news — a place has become available {memberName ? `for ${memberName}` : 'for you'} on the{' '}
                        <strong>{membershipType}</strong> membership at <strong>{locationName}</strong>, and it&apos;s yours if you want it.</>}
            </Text>
            <div style={box}>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    📍 <strong>Location:</strong> {locationName}
                </Text>
                <Text style={{ ...baseStyles.text, margin: '0 0 8px' }}>
                    🥋 <strong>Membership:</strong> {membershipType} — {priceLabel}
                </Text>
                <Text style={{ ...baseStyles.text, margin: 0, color: '#b45309' }}>
                    ⏰ <strong>Accept by:</strong> {expiresLabel}
                </Text>
            </div>
            <div style={baseStyles.buttonContainer}>
                <Link href={payUrl} style={baseStyles.button}>Accept &amp; complete payment</Link>
            </div>
            <Text style={baseStyles.text}>
                The place is held for you until then. If we don&apos;t hear from you by the deadline, it will be
                offered to the next person and you&apos;ll move to the back of the queue — you won&apos;t lose your
                registration.
            </Text>
            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />
            <Text style={baseStyles.text}>
                Changed your mind? No problem — just reply to this email and we&apos;ll free the place up for someone else.
            </Text>
            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

// ---------------------------------------------------------------------------
// 3. Offer expired — back of the queue
// ---------------------------------------------------------------------------
interface WaitlistExpiredProps {
    firstName: string;
    memberName?: string | null;
    locationName: string;
    membershipType: string;
    newPosition: number;
}

export function WaitlistExpiredEmail({ firstName, memberName, locationName, membershipType, newPosition }: WaitlistExpiredProps) {
    return (
        <BaseEmailLayout previewText={`Your place offer at ${locationName} has expired`}>
            <Text style={baseStyles.heading}>Your place offer has expired</Text>
            <Text style={baseStyles.text}>Assalamu Alaikum {firstName},</Text>
            <Text style={baseStyles.text}>
                The 72-hour window to accept the place {memberName ? `for ${memberName}` : ''} on the{' '}
                <strong>{membershipType}</strong> membership at <strong>{locationName}</strong> has passed, so
                we&apos;ve offered it to the next person in line.
            </Text>
            <Text style={baseStyles.text}>
                You haven&apos;t lost your registration — {memberName ? `${memberName} is` : 'you are'} still on the
                waiting list, now at <strong>position #{newPosition}</strong>, and we&apos;ll email you again when
                another place opens up.
            </Text>
            <Text style={baseStyles.text}>
                If you no longer wish to remain on the list, or something went wrong, just reply to this email.
            </Text>
            <Text style={baseStyles.text}>
                JazakAllahu Khayran,<br />
                <strong>The Sport of Kings Team</strong>
            </Text>
        </BaseEmailLayout>
    );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
export function renderWaitlistJoinedEmail(props: WaitlistJoinedProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<WaitlistJoinedEmail {...props} />);
}
export function renderWaitlistOfferEmail(props: WaitlistOfferProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<WaitlistOfferEmail {...props} />);
}
export function renderWaitlistExpiredEmail(props: WaitlistExpiredProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<WaitlistExpiredEmail {...props} />);
}
