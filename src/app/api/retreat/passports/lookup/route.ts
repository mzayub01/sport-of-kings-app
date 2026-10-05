import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS } from '@/lib/retreat';
import {
    clientIp,
    uploadsClosed,
    tooManyAttempts,
    recordAttempt,
    loadPaidRegistrations,
    matchBookings,
    listPassports,
} from '@/lib/retreat-passports-server';

// Public: find a participant's booking from the email + phone they registered
// with. Returns attendee names and whether each passport has been received —
// never any file. Failed lookups are rate-limited per IP and all failures
// return the same message, so this can't be used to test email addresses.
export async function POST(request: NextRequest) {
    try {
        if (uploadsClosed()) {
            return NextResponse.json({ error: 'Passport collection for this retreat has closed.', closed: true }, { status: 410 });
        }

        const { email, phone } = await request.json();
        if (typeof email !== 'string' || typeof phone !== 'string' || !email.trim() || !phone.trim()) {
            return NextResponse.json({ error: 'Please enter the email and phone number you registered with.' }, { status: 400 });
        }

        const admin = await createAdminClient();
        const ip = clientIp(request);

        if (await tooManyAttempts(admin, ip, 'lookup', 10, 15)) {
            return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes and try again.' }, { status: 429 });
        }

        const matches = matchBookings(await loadPaidRegistrations(admin), email, phone);
        if (matches.length === 0) {
            await recordAttempt(admin, ip, 'lookup');
            return NextResponse.json(
                { error: 'We couldn’t find a booking with those details. Check the email and phone number used when registering.' },
                { status: 404 }
            );
        }

        const passports = await listPassports(admin);
        const received = new Set(passports.filter(p => p.registration_id).map(p => `${p.registration_id}:${p.attendee_index}`));

        return NextResponse.json({
            bookings: matches.map(r => ({
                registrationId: r.id,
                leadName: r.lead_name,
                attendees: (r.attendees || []).map((a, index) => ({
                    index,
                    name: a.name,
                    category: CATEGORY_LABELS[a.category] || 'Guest',
                    received: received.has(`${r.id}:${index}`),
                })),
            })),
        });
    } catch (error) {
        console.error('Passport lookup error:', error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
