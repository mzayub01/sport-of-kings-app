import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { RETREAT } from '@/lib/retreat';
import {
    verifyHotelAccess,
    logHotelAccess,
    loadPaidRegistrations,
    listPassports,
    getPassport,
    signedViewUrl,
    signedBundleUrl,
    type PassportRow,
} from '@/lib/retreat-passports-server';

// Hotel portal API. Every call carries the link token AND the passcode and is
// re-verified (not revoked, not expired, passcode correct). Every successful
// action is written to the access log.

const safeName = (value: string) => value.replace(/[^\p{L}\p{N} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Guest';
const extFor = (row: PassportRow) => row.storage_path.split('.').pop() || 'jpg';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const admin = await createAdminClient();

        const verified = await verifyHotelAccess(admin, String(body.token || ''), String(body.passcode || ''), request);
        if (!verified.ok) {
            return NextResponse.json({ error: verified.error }, { status: verified.status });
        }
        const { access } = verified;

        if (body.action === 'list') {
            const [registrations, passports] = await Promise.all([loadPaidRegistrations(admin), listPassports(admin)]);
            const leadById = new Map(registrations.map(r => [r.id, r.lead_name]));
            const expected = registrations.reduce((sum, r) => sum + (r.attendees?.length || 0), 0);

            await logHotelAccess(admin, access.id, 'open', request);

            return NextResponse.json({
                retreat: RETREAT.name,
                dates: RETREAT.dates,
                label: access.label,
                expiresAt: access.expires_at,
                expectedGuests: expected,
                guests: passports.map(p => ({
                    id: p.id,
                    name: p.attendee_name,
                    group: p.registration_id ? (leadById.get(p.registration_id) || 'Booking') : 'Other guests',
                    isPdf: p.mime_type === 'application/pdf',
                    uploadedAt: p.uploaded_at,
                })),
            });
        }

        if (body.action === 'view') {
            const row = await getPassport(admin, String(body.passportId || ''));
            if (!row) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            const url = await signedViewUrl(admin, row);
            if (!url) return NextResponse.json({ error: 'Could not open that document' }, { status: 500 });
            await logHotelAccess(admin, access.id, 'view', request, row);
            return NextResponse.json({ url });
        }

        if (body.action === 'bundle') {
            const [registrations, passports] = await Promise.all([loadPaidRegistrations(admin), listPassports(admin)]);
            const leadById = new Map(registrations.map(r => [r.id, r.lead_name]));
            const used = new Set<string>();
            const files: { url: string; path: string }[] = [];

            for (const row of passports) {
                const url = await signedBundleUrl(admin, row);
                if (!url) continue;
                const folder = row.registration_id ? `Booking - ${safeName(leadById.get(row.registration_id) || 'Guest')}` : 'Other guests';
                let path = `${folder}/${safeName(row.attendee_name)}.${extFor(row)}`;
                for (let n = 2; used.has(path.toLowerCase()); n++) {
                    path = `${folder}/${safeName(row.attendee_name)} (${n}).${extFor(row)}`;
                }
                used.add(path.toLowerCase());
                files.push({ url, path });
            }

            await logHotelAccess(admin, access.id, 'download_all', request);
            return NextResponse.json({ files });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('Hotel portal error:', error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
