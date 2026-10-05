import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
    MAX_FILE_BYTES,
    clientIp,
    uploadsClosed,
    tooManyAttempts,
    recordAttempt,
    loadPaidRegistrations,
    matchBookings,
    sniffFile,
    storePassport,
} from '@/lib/retreat-passports-server';

// Public: store one passport file. Two modes:
//   booking   — the booking email is re-verified on every upload, then the file
//               is attached to (registrationId, attendeeIndex); re-uploading
//               replaces the previous file
//   unmatched — "can't find my booking": name + file, held for an admin to assign
// This route only ever writes; it never returns a file or a URL to one.
export async function POST(request: NextRequest) {
    try {
        if (uploadsClosed()) {
            return NextResponse.json({ error: 'Passport collection for this retreat has closed.' }, { status: 410 });
        }

        const form = await request.formData();
        const mode = form.get('mode');
        const file = form.get('file');

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'Please choose a file to upload.' }, { status: 400 });
        }
        if (file.size > MAX_FILE_BYTES) {
            return NextResponse.json({ error: 'That file is too large. Please upload a photo of the passport page instead.' }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const kind = sniffFile(buffer);
        if (!kind) {
            return NextResponse.json({ error: 'Please upload a photo (JPEG or PNG) or a PDF of the passport.' }, { status: 415 });
        }

        const admin = await createAdminClient();
        const ip = clientIp(request);

        if (mode === 'booking') {
            const email = String(form.get('email') || '');
            const registrationId = String(form.get('registrationId') || '');
            const attendeeIndex = Number(form.get('attendeeIndex'));

            if (await tooManyAttempts(admin, ip, 'upload', 60, 60)) {
                return NextResponse.json({ error: 'Too many uploads from this device. Please try again later.' }, { status: 429 });
            }

            const booking = matchBookings(await loadPaidRegistrations(admin), email)
                .find(r => r.id === registrationId);
            if (!booking) {
                await recordAttempt(admin, ip, 'lookup');
                return NextResponse.json({ error: 'We couldn’t confirm your booking. Please start again.' }, { status: 403 });
            }

            const attendee = Number.isInteger(attendeeIndex) ? booking.attendees?.[attendeeIndex] : undefined;
            if (!attendee) {
                return NextResponse.json({ error: 'That guest isn’t on this booking.' }, { status: 400 });
            }

            await recordAttempt(admin, ip, 'upload');
            const stored = await storePassport(admin, {
                registrationId: booking.id,
                attendeeIndex,
                attendeeName: attendee.name,
                buffer,
                kind,
            });
            if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        if (mode === 'unmatched') {
            const name = String(form.get('name') || '').trim().slice(0, 80);
            const contact = String(form.get('contact') || '').trim().slice(0, 120);
            if (name.length < 3) {
                return NextResponse.json({ error: 'Please enter the full name as shown on the passport.' }, { status: 400 });
            }

            if (await tooManyAttempts(admin, ip, 'unmatched', 10, 60)) {
                return NextResponse.json({ error: 'Too many uploads from this device. Please try again later.' }, { status: 429 });
            }
            await recordAttempt(admin, ip, 'unmatched');

            const stored = await storePassport(admin, {
                registrationId: null,
                attendeeIndex: null,
                attendeeName: name,
                note: contact || null,
                buffer,
                kind,
            });
            if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    } catch (error) {
        console.error('Passport upload error:', error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
