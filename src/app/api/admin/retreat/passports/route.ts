import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { RETREAT, CATEGORY_LABELS, PASSPORT_PURGE_AFTER } from '@/lib/retreat';
import {
    sha256,
    loadPaidRegistrations,
    listPassports,
    getPassport,
    deletePassport,
    signedViewUrl,
    purgeAllPassports,
    purgeIfDue,
    uploadsClosed,
    generateHotelCredentials,
    passcodeHash,
} from '@/lib/retreat-passports-server';

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('user_id', user.id)
        .single();
    if (profile?.role !== 'admin') {
        return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) } as const;
    }
    return { user, name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null } as const;
}

const SETUP_HINT = 'Passport storage isn’t set up yet — run supabase/migrations/retreat_passports.sql in the Supabase SQL editor.';

// Everything the admin passport panel needs. Also runs the retention purge
// once the date has passed (the app has no scheduled jobs).
export async function GET() {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    try {
        const admin = await createAdminClient();

        const probe = await admin.from('retreat_passports').select('id').limit(1);
        if (probe.error) {
            const missingTable = ['42P01', 'PGRST205'].includes(probe.error.code || '')
                || /does not exist|could not find the table/i.test(probe.error.message || '');
            if (missingTable) {
                return NextResponse.json({ error: SETUP_HINT, setupRequired: true }, { status: 503 });
            }
            throw new Error(probe.error.message);
        }

        const purged = await purgeIfDue(admin);

        const [registrations, passports, linksRes, logRes] = await Promise.all([
            loadPaidRegistrations(admin),
            listPassports(admin),
            admin.from('retreat_hotel_access')
                .select('id, label, expires_at, revoked_at, created_by_name, created_at')
                .eq('retreat_year', RETREAT.year)
                .order('created_at', { ascending: false }),
            admin.from('retreat_passport_access_log')
                .select('id, access_id, action, passport_name, ip, created_at')
                .order('created_at', { ascending: false })
                .limit(300),
        ]);

        const log = logRes.data || [];
        const links = (linksRes.data || []).map(link => {
            const entries = log.filter(l => l.access_id === link.id);
            return {
                id: link.id,
                label: link.label,
                expiresAt: link.expires_at,
                revokedAt: link.revoked_at,
                createdByName: link.created_by_name,
                createdAt: link.created_at,
                opens: entries.filter(l => l.action === 'open').length,
                views: entries.filter(l => l.action === 'view').length,
                downloads: entries.filter(l => l.action === 'download_all').length,
                failedPasscodes: entries.filter(l => l.action === 'failed_passcode').length,
                lastActivity: entries[0]?.created_at || null,
            };
        });
        const labelById = new Map(links.map(l => [l.id, l.label]));

        return NextResponse.json({
            purgeAfter: PASSPORT_PURGE_AFTER,
            closed: uploadsClosed(),
            purgedNow: purged,
            registrations: registrations.map(r => ({
                id: r.id,
                leadName: r.lead_name,
                attendees: (r.attendees || []).map((a, index) => ({
                    index,
                    name: a.name,
                    category: CATEGORY_LABELS[a.category] || 'Guest',
                })),
            })),
            passports: passports.map(p => ({
                id: p.id,
                registrationId: p.registration_id,
                attendeeIndex: p.attendee_index,
                name: p.attendee_name,
                note: p.uploader_note,
                mime: p.mime_type,
                sizeBytes: p.size_bytes,
                uploadedAt: p.uploaded_at,
            })),
            hotelLinks: links,
            log: log.slice(0, 40).map(l => ({
                id: l.id,
                link: labelById.get(l.access_id) || 'Hotel link',
                action: l.action,
                passportName: l.passport_name,
                ip: l.ip,
                at: l.created_at,
            })),
        });
    } catch (error) {
        console.error('Admin passports GET error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load passports' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    try {
        const body = await request.json();
        const admin = await createAdminClient();

        switch (body.action) {
            case 'view': {
                const row = await getPassport(admin, String(body.passportId || ''));
                if (!row) return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
                const url = await signedViewUrl(admin, row);
                if (!url) return NextResponse.json({ error: 'Could not open that file' }, { status: 500 });
                return NextResponse.json({ url });
            }

            case 'delete': {
                const row = await getPassport(admin, String(body.passportId || ''));
                if (!row) return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
                await deletePassport(admin, row);
                return NextResponse.json({ success: true });
            }

            case 'assign': {
                const row = await getPassport(admin, String(body.passportId || ''));
                if (!row) return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
                const registration = (await loadPaidRegistrations(admin)).find(r => r.id === body.registrationId);
                const index = Number(body.attendeeIndex);
                const attendee = registration && Number.isInteger(index) ? registration.attendees?.[index] : undefined;
                if (!registration || !attendee) {
                    return NextResponse.json({ error: 'That guest isn’t on a paid booking' }, { status: 400 });
                }
                const { data: taken } = await admin
                    .from('retreat_passports')
                    .select('id')
                    .eq('registration_id', registration.id)
                    .eq('attendee_index', index)
                    .maybeSingle();
                if (taken) {
                    return NextResponse.json({ error: `${attendee.name} already has a passport on file — delete it first if this one should replace it` }, { status: 409 });
                }
                const typedName = row.attendee_name;
                const { error } = await admin
                    .from('retreat_passports')
                    .update({
                        registration_id: registration.id,
                        attendee_index: index,
                        attendee_name: attendee.name,
                        uploader_note: [`Uploaded as “${typedName}”`, row.uploader_note].filter(Boolean).join(' · '),
                    })
                    .eq('id', row.id);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            case 'purge': {
                if (body.confirm !== 'DELETE') {
                    return NextResponse.json({ error: 'Confirmation text did not match' }, { status: 400 });
                }
                const removed = await purgeAllPassports(admin);
                return NextResponse.json({ success: true, removed });
            }

            case 'create_hotel_link': {
                const label = String(body.label || '').trim().slice(0, 80) || 'Hotel reception';
                const expiresOn = String(body.expiresOn || '');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
                    return NextResponse.json({ error: 'Choose an expiry date' }, { status: 400 });
                }
                const expiresAt = new Date(`${expiresOn}T23:59:59Z`);
                if (isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
                    return NextResponse.json({ error: 'The expiry date must be in the future' }, { status: 400 });
                }
                if (expiresOn > PASSPORT_PURGE_AFTER) {
                    return NextResponse.json({ error: `Access can’t outlast the deletion date (${PASSPORT_PURGE_AFTER})` }, { status: 400 });
                }

                const { token, passcode } = generateHotelCredentials();
                const { error } = await admin.from('retreat_hotel_access').insert({
                    retreat_year: RETREAT.year,
                    label,
                    token_hash: sha256(token),
                    passcode_hash: passcodeHash(token, passcode),
                    expires_at: expiresAt.toISOString(),
                    created_by: auth.user.id,
                    created_by_name: auth.name,
                });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });

                // The token and passcode are returned exactly once; only hashes are stored
                return NextResponse.json({ success: true, token, passcode, label, expiresAt: expiresAt.toISOString() });
            }

            case 'revoke_hotel_link': {
                const { error } = await admin
                    .from('retreat_hotel_access')
                    .update({ revoked_at: new Date().toISOString() })
                    .eq('id', String(body.accessId || ''))
                    .is('revoked_at', null);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Admin passports POST error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 500 });
    }
}
