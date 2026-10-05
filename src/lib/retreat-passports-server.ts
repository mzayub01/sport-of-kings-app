// Retreat passport collection — server-side only (service-role client).
//
// Passport copies are identity documents. Rules this module enforces:
//   - files live in a PRIVATE bucket and are only ever served through
//     short-lived signed URLs issued by an authenticated/verified route
//   - the public upload page can add or replace a file but never read one
//   - hotel access needs an unguessable link AND a passcode, expires, can be
//     revoked, and every action is logged
//   - everything is purged after PASSPORT_PURGE_AFTER

import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RETREAT, PASSPORT_PURGE_AFTER, type RetreatAttendee } from './retreat';
import { ukDateString } from './dates';

export const PASSPORT_BUCKET = 'retreat-passports';
// Vercel rejects request bodies over 4.5 MB; the browser shrinks images first
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
const VIEW_URL_SECONDS = 60;
const BUNDLE_URL_SECONDS = 300;

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function clientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown').trim();
}

/** Uploads close (and files are purged) once the retention date has passed. */
export function uploadsClosed(): boolean {
    return ukDateString() > PASSPORT_PURGE_AFTER;
}

// ---------------------------------------------------------------------------
// Rate limiting (DB-backed; serverless instances share no memory)
// ---------------------------------------------------------------------------

export async function tooManyAttempts(admin: SupabaseClient, key: string, kind: string, max: number, windowMinutes: number): Promise<boolean> {
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const { count, error } = await admin
        .from('retreat_passport_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('key_hash', sha256(key))
        .eq('kind', kind)
        .gte('created_at', since);
    if (error) {
        console.error('Passport rate-limit check failed:', error.message);
        return false;
    }
    return (count || 0) >= max;
}

export async function recordAttempt(admin: SupabaseClient, key: string, kind: string): Promise<void> {
    await admin.from('retreat_passport_attempts').insert({ key_hash: sha256(key), kind });
}

// ---------------------------------------------------------------------------
// Booking lookup
// ---------------------------------------------------------------------------

export interface RegistrationLite {
    id: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string;
    attendees: RetreatAttendee[];
}

/** Last 9 digits, so 07123 456789 and +44 7123 456789 compare equal. */
export function phoneKey(phone: string): string {
    return (phone || '').replace(/\D/g, '').slice(-9);
}

export async function loadPaidRegistrations(admin: SupabaseClient): Promise<RegistrationLite[]> {
    const { data, error } = await admin
        .from('retreat_registrations')
        .select('id, lead_name, lead_email, lead_phone, attendees')
        .eq('retreat_year', RETREAT.year)
        .eq('status', 'paid')
        .order('created_at');
    if (error) throw new Error(error.message);
    return (data || []) as RegistrationLite[];
}

/** Bookings whose lead email AND phone both match (compared in code, so no SQL wildcards). */
export function matchBookings(registrations: RegistrationLite[], email: string, phone: string): RegistrationLite[] {
    const wantedEmail = (email || '').trim().toLowerCase();
    const wantedPhone = phoneKey(phone);
    if (!wantedEmail || wantedPhone.length < 7) return [];
    return registrations.filter(r =>
        (r.lead_email || '').trim().toLowerCase() === wantedEmail &&
        phoneKey(r.lead_phone) === wantedPhone
    );
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export interface FileKind { mime: string; ext: string }

/** Identify a file from its leading bytes; the browser-supplied type is not trusted. */
export function sniffFile(buffer: Buffer): FileKind | null {
    if (buffer.length < 12) return null;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
    if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
    if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
    return null;
}

export interface PassportRow {
    id: string;
    registration_id: string | null;
    attendee_index: number | null;
    attendee_name: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number | null;
    uploader_note: string | null;
    uploaded_at: string;
}

const PASSPORT_COLUMNS = 'id, registration_id, attendee_index, attendee_name, storage_path, mime_type, size_bytes, uploader_note, uploaded_at';

export async function listPassports(admin: SupabaseClient): Promise<PassportRow[]> {
    const { data, error } = await admin
        .from('retreat_passports')
        .select(PASSPORT_COLUMNS)
        .eq('retreat_year', RETREAT.year)
        .order('uploaded_at');
    if (error) throw new Error(error.message);
    return (data || []) as PassportRow[];
}

export async function getPassport(admin: SupabaseClient, id: string): Promise<PassportRow | null> {
    const { data } = await admin.from('retreat_passports').select(PASSPORT_COLUMNS).eq('id', id).maybeSingle();
    return (data as PassportRow | null) || null;
}

/** Store a passport; an existing file for the same attendee slot is replaced. */
export async function storePassport(admin: SupabaseClient, input: {
    registrationId: string | null;
    attendeeIndex: number | null;
    attendeeName: string;
    note?: string | null;
    buffer: Buffer;
    kind: FileKind;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    const path = `${RETREAT.year}/${input.registrationId || 'unmatched'}/${randomUUID()}.${input.kind.ext}`;

    const { error: uploadError } = await admin.storage
        .from(PASSPORT_BUCKET)
        .upload(path, input.buffer, { contentType: input.kind.mime, upsert: false });
    if (uploadError) {
        console.error('Passport storage upload failed:', uploadError.message);
        return { ok: false, error: 'We could not store that file. Please try again.' };
    }

    const fields = {
        attendee_name: input.attendeeName,
        storage_path: path,
        mime_type: input.kind.mime,
        size_bytes: input.buffer.length,
        uploaded_at: new Date().toISOString(),
    };

    if (input.registrationId !== null && input.attendeeIndex !== null) {
        const { data: existing } = await admin
            .from('retreat_passports')
            .select('id, storage_path')
            .eq('registration_id', input.registrationId)
            .eq('attendee_index', input.attendeeIndex)
            .maybeSingle();

        if (existing) {
            const previousPath: string = existing.storage_path;
            const { error } = await admin.from('retreat_passports').update(fields).eq('id', existing.id);
            if (error) {
                await admin.storage.from(PASSPORT_BUCKET).remove([path]);
                console.error('Passport record update failed:', error.message);
                return { ok: false, error: 'We could not save that file. Please try again.' };
            }
            await admin.storage.from(PASSPORT_BUCKET).remove([previousPath]);
            return { ok: true, id: existing.id };
        }
    }

    const { data, error } = await admin
        .from('retreat_passports')
        .insert({
            retreat_year: RETREAT.year,
            registration_id: input.registrationId,
            attendee_index: input.attendeeIndex,
            uploader_note: input.note || null,
            ...fields,
        })
        .select('id')
        .single();

    if (error || !data) {
        await admin.storage.from(PASSPORT_BUCKET).remove([path]);
        console.error('Passport record insert failed:', error?.message);
        return { ok: false, error: 'We could not save that file. Please try again.' };
    }
    return { ok: true, id: data.id };
}

export async function deletePassport(admin: SupabaseClient, row: PassportRow): Promise<void> {
    await admin.storage.from(PASSPORT_BUCKET).remove([row.storage_path]);
    await admin.from('retreat_passports').delete().eq('id', row.id);
}

export async function signedViewUrl(admin: SupabaseClient, row: PassportRow, seconds = VIEW_URL_SECONDS): Promise<string | null> {
    const { data, error } = await admin.storage.from(PASSPORT_BUCKET).createSignedUrl(row.storage_path, seconds);
    if (error || !data) {
        console.error('Passport signed URL failed:', error?.message);
        return null;
    }
    return data.signedUrl;
}

export const signedBundleUrl = (admin: SupabaseClient, row: PassportRow) => signedViewUrl(admin, row, BUNDLE_URL_SECONDS);

/** Delete every passport file and record, and close every hotel link. */
export async function purgeAllPassports(admin: SupabaseClient): Promise<number> {
    const rows = await listPassports(admin);
    for (let i = 0; i < rows.length; i += 100) {
        await admin.storage.from(PASSPORT_BUCKET).remove(rows.slice(i, i + 100).map(r => r.storage_path));
    }
    await admin.from('retreat_passports').delete().eq('retreat_year', RETREAT.year);
    await admin
        .from('retreat_hotel_access')
        .update({ revoked_at: new Date().toISOString() })
        .eq('retreat_year', RETREAT.year)
        .is('revoked_at', null);
    return rows.length;
}

/** Runs the retention purge once the date has passed. Returns files removed. */
export async function purgeIfDue(admin: SupabaseClient): Promise<number> {
    if (!uploadsClosed()) return 0;
    const { count } = await admin
        .from('retreat_passports')
        .select('id', { count: 'exact', head: true })
        .eq('retreat_year', RETREAT.year);
    if (!count) return 0;
    return purgeAllPassports(admin);
}

// ---------------------------------------------------------------------------
// Hotel access
// ---------------------------------------------------------------------------

export interface HotelAccessRow {
    id: string;
    label: string;
    token_hash: string;
    passcode_hash: string;
    expires_at: string;
    revoked_at: string | null;
    created_by_name: string | null;
    created_at: string;
}

const PASSCODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

export const normalisePasscode = (passcode: string) => (passcode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const passcodeHash = (token: string, passcode: string) => sha256(`${token}:${normalisePasscode(passcode)}`);

export function generateHotelCredentials(): { token: string; passcode: string } {
    const token = randomBytes(32).toString('base64url');
    let raw = '';
    for (let i = 0; i < 8; i++) raw += PASSCODE_ALPHABET[randomInt(PASSCODE_ALPHABET.length)];
    return { token, passcode: `${raw.slice(0, 4)}-${raw.slice(4)}` };
}

export async function logHotelAccess(admin: SupabaseClient, accessId: string, action: string, request: Request, passport?: PassportRow | null): Promise<void> {
    await admin.from('retreat_passport_access_log').insert({
        access_id: accessId,
        action,
        passport_id: passport?.id || null,
        passport_name: passport?.attendee_name || null,
        ip: clientIp(request),
        user_agent: (request.headers.get('user-agent') || '').slice(0, 300),
    });
}

export type HotelVerification =
    | { ok: true; access: HotelAccessRow }
    | { ok: false; status: number; error: string };

export async function verifyHotelAccess(admin: SupabaseClient, token: string, passcode: string, request: Request): Promise<HotelVerification> {
    if (!token || token.length < 20) return { ok: false, status: 404, error: 'This link is not valid.' };

    const { data, error } = await admin
        .from('retreat_hotel_access')
        .select('id, label, token_hash, passcode_hash, expires_at, revoked_at, created_by_name, created_at')
        .eq('token_hash', sha256(token))
        .maybeSingle();
    // A database failure must not be reported to the hotel as "link not valid"
    if (error) throw new Error(`Hotel access lookup failed: ${error.message}`);
    const access = data as HotelAccessRow | null;

    if (!access) return { ok: false, status: 404, error: 'This link is not valid.' };
    if (access.revoked_at) return { ok: false, status: 403, error: 'This access link has been withdrawn. Please contact the retreat organisers.' };
    if (new Date(access.expires_at).getTime() < Date.now()) return { ok: false, status: 410, error: 'This access link has expired. Please contact the retreat organisers.' };

    const limitKey = `hotel:${access.id}`;
    if (await tooManyAttempts(admin, limitKey, 'hotel_passcode', 8, 15)) {
        return { ok: false, status: 429, error: 'Too many incorrect passcodes. Please wait 15 minutes and try again.' };
    }

    if (passcodeHash(token, passcode) !== access.passcode_hash) {
        await recordAttempt(admin, limitKey, 'hotel_passcode');
        await logHotelAccess(admin, access.id, 'failed_passcode', request);
        return { ok: false, status: 401, error: 'That passcode is not correct.' };
    }

    return { ok: true, access };
}
