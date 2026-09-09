// Waitlist lifecycle (server-side, service-role client):
//   waiting -> offered (place held as a pending membership, 72h to pay)
//           -> paid   (Stripe webhook activates membership, entry removed)
//           -> expired (hold released, entry moves to the back of the queue)

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from './email';
import { renderMembershipActivatedEmail } from './email-templates';
import {
    renderWaitlistJoinedEmail,
    renderWaitlistOfferEmail,
    renderWaitlistExpiredEmail,
} from './email-templates/waitlist';

export const OFFER_HOURS = 72;
export const REMINDER_HOURS_BEFORE = 24;

export interface WaitlistEntry {
    id: string;
    user_id: string;
    location_id: string;
    membership_type_id: string | null;
    position: number;
    status: 'waiting' | 'offered';
    offered_at: string | null;
    offer_expires_at: string | null;
    reminder_sent_at: string | null;
    membership_id: string | null;
    joined_at: string;
    times_expired: number;
}

interface EntryContext {
    recipientEmail: string | null;
    greetingName: string;
    memberName: string | null; // set when the entry belongs to a child
    locationName: string;
    membershipType: string;
    price: number; // pounds
}

const ENTRY_COLUMNS = 'id, user_id, location_id, membership_type_id, position, status, offered_at, offer_expires_at, reminder_sent_at, membership_id, joined_at, times_expired';

export function formatExpiry(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/London',
    });
}

/** 1-based rank of an entry within its location + membership-type queue. */
export async function queueRank(admin: SupabaseClient, entry: Pick<WaitlistEntry, 'location_id' | 'membership_type_id' | 'position'>): Promise<number> {
    let q = admin
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .eq('location_id', entry.location_id)
        .lt('position', entry.position);
    q = entry.membership_type_id ? q.eq('membership_type_id', entry.membership_type_id) : q.is('membership_type_id', null);
    const { count } = await q;
    return (count || 0) + 1;
}

async function nextPosition(admin: SupabaseClient, locationId: string, membershipTypeId: string | null): Promise<number> {
    let q = admin.from('waitlist').select('position').eq('location_id', locationId).order('position', { ascending: false }).limit(1);
    q = membershipTypeId ? q.eq('membership_type_id', membershipTypeId) : q.is('membership_type_id', null);
    const { data } = await q.maybeSingle();
    return (data?.position || 0) + 1;
}

export async function loadEntry(admin: SupabaseClient, waitlistId: string): Promise<WaitlistEntry | null> {
    const { data } = await admin.from('waitlist').select(ENTRY_COLUMNS).eq('id', waitlistId).maybeSingle();
    return (data as WaitlistEntry | null) || null;
}

async function loadContext(admin: SupabaseClient, entry: WaitlistEntry): Promise<EntryContext> {
    const [{ data: profile }, { data: location }, { data: type }] = await Promise.all([
        admin.from('profiles').select('first_name, last_name, email, is_child, parent_guardian_id').eq('user_id', entry.user_id).maybeSingle(),
        admin.from('locations').select('name').eq('id', entry.location_id).maybeSingle(),
        entry.membership_type_id
            ? admin.from('membership_types').select('name, price').eq('id', entry.membership_type_id).maybeSingle()
            : Promise.resolve({ data: null }),
    ]);

    let recipientEmail: string | null = profile?.email || null;
    let greetingName = profile?.first_name || 'there';
    let memberName: string | null = null;

    if (profile?.is_child && profile.parent_guardian_id) {
        const { data: parent } = await admin.from('profiles').select('first_name, email').eq('id', profile.parent_guardian_id).maybeSingle();
        if (parent?.email) {
            recipientEmail = parent.email;
            greetingName = parent.first_name;
            memberName = `${profile.first_name} ${profile.last_name}`;
        }
    }

    return {
        recipientEmail,
        greetingName,
        memberName,
        locationName: location?.name || 'Sport of Kings',
        membershipType: type?.name || 'Membership',
        price: type?.price ?? 0,
    };
}

async function logEmail(admin: SupabaseClient, userId: string, type: string, sentTo: string, sentBy: string | null, sentByName: string | null) {
    await admin.from('member_email_log').insert({ user_id: userId, email_type: type, sent_to: sentTo, sent_by: sentBy, sent_by_name: sentByName });
}

/** Email a newly added waitlister their position and what to expect. */
export async function notifyJoined(admin: SupabaseClient, entry: WaitlistEntry): Promise<void> {
    const ctx = await loadContext(admin, entry);
    if (!ctx.recipientEmail) return;
    const position = await queueRank(admin, entry);
    await sendEmail({
        to: ctx.recipientEmail,
        subject: `You're #${position} on the waitlist — ${ctx.membershipType} at ${ctx.locationName}`,
        html: renderWaitlistJoinedEmail({ firstName: ctx.greetingName, memberName: ctx.memberName, locationName: ctx.locationName, membershipType: ctx.membershipType, position }),
        replyTo: 'sportofkings786@gmail.com',
    });
    await logEmail(admin, entry.user_id, 'waitlist_joined', ctx.recipientEmail, null, 'System');
}

/**
 * Expire lapsed offers (release the held place, move to the back of the queue,
 * email) and send 24h reminders. Safe to run any time; idempotent.
 */
export async function sweepWaitlist(admin: SupabaseClient): Promise<{ expired: number; reminded: number }> {
    const now = new Date();
    let expired = 0;
    let reminded = 0;

    const { data: lapsed } = await admin
        .from('waitlist')
        .select(ENTRY_COLUMNS)
        .eq('status', 'offered')
        .lt('offer_expires_at', now.toISOString());

    for (const entry of (lapsed || []) as WaitlistEntry[]) {
        // If they actually paid, the webhook normally removes the entry; be safe
        if (entry.membership_id) {
            const { data: m } = await admin.from('memberships').select('id, status').eq('id', entry.membership_id).maybeSingle();
            if (m?.status === 'active') {
                await admin.from('waitlist').delete().eq('id', entry.id);
                continue;
            }
            if (m && m.status === 'pending') {
                await admin.from('memberships').delete().eq('id', m.id); // release the hold
            }
        }

        const position = await nextPosition(admin, entry.location_id, entry.membership_type_id);
        await admin.from('waitlist').update({
            status: 'waiting',
            offered_at: null,
            offer_expires_at: null,
            reminder_sent_at: null,
            membership_id: null,
            position,
            times_expired: entry.times_expired + 1,
        }).eq('id', entry.id);
        expired++;

        const ctx = await loadContext(admin, entry);
        if (ctx.recipientEmail) {
            const newPosition = await queueRank(admin, { ...entry, position });
            await sendEmail({
                to: ctx.recipientEmail,
                subject: `Your place offer at ${ctx.locationName} has expired`,
                html: renderWaitlistExpiredEmail({ firstName: ctx.greetingName, memberName: ctx.memberName, locationName: ctx.locationName, membershipType: ctx.membershipType, newPosition }),
                replyTo: 'sportofkings786@gmail.com',
            });
            await logEmail(admin, entry.user_id, 'waitlist_expired', ctx.recipientEmail, null, 'System');
        }
    }

    const reminderCutoff = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 3600 * 1000).toISOString();
    const { data: dueReminder } = await admin
        .from('waitlist')
        .select(ENTRY_COLUMNS)
        .eq('status', 'offered')
        .is('reminder_sent_at', null)
        .gt('offer_expires_at', now.toISOString())
        .lt('offer_expires_at', reminderCutoff);

    for (const entry of (dueReminder || []) as WaitlistEntry[]) {
        const ctx = await loadContext(admin, entry);
        if (ctx.recipientEmail && entry.offer_expires_at) {
            await sendEmail({
                to: ctx.recipientEmail,
                subject: `Reminder: your place at ${ctx.locationName} expires ${formatExpiry(entry.offer_expires_at)}`,
                html: renderWaitlistOfferEmail({
                    firstName: ctx.greetingName, memberName: ctx.memberName, locationName: ctx.locationName,
                    membershipType: ctx.membershipType, priceLabel: `£${ctx.price}/month`,
                    expiresLabel: formatExpiry(entry.offer_expires_at),
                    payUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sportofkings.info'}/dashboard`,
                    isReminder: true,
                }),
                replyTo: 'sportofkings786@gmail.com',
            });
            await logEmail(admin, entry.user_id, 'waitlist_reminder', ctx.recipientEmail, null, 'System');
        }
        await admin.from('waitlist').update({ reminder_sent_at: now.toISOString() }).eq('id', entry.id);
        reminded++;
    }

    return { expired, reminded };
}

export type OfferResult =
    | { success: true; mode: 'offered'; expiresAt: string; recipient: string | null }
    | { success: true; mode: 'activated'; recipient: string | null }
    | { success: false; error: string; full?: boolean; status: number };

/**
 * Offer the next place to a specific waitlist entry. Holds the place as a
 * pending membership (the DB capacity trigger refuses it if the type is full)
 * and emails the member a 72-hour link to pay. Free / Cheadle memberships are
 * activated immediately.
 */
export async function offerPlace(admin: SupabaseClient, waitlistId: string, actor: { id: string; name: string | null }): Promise<OfferResult> {
    await sweepWaitlist(admin);

    const entry = await loadEntry(admin, waitlistId);
    if (!entry) return { success: false, error: 'Waitlist entry not found', status: 404 };
    if (entry.status === 'offered') return { success: false, error: 'This person already has an open offer', status: 409 };
    if (!entry.membership_type_id) return { success: false, error: 'This entry has no membership type — set one before offering', status: 400 };

    const ctx = await loadContext(admin, entry);
    const isFree = ctx.price === 0 || /cheadle (masjid|mosque)/i.test(ctx.locationName);

    const { data: existing } = await admin
        .from('memberships')
        .select('id, status')
        .eq('user_id', entry.user_id)
        .eq('location_id', entry.location_id)
        .maybeSingle();

    if (existing?.status === 'active') {
        await admin.from('waitlist').delete().eq('id', entry.id);
        return { success: false, error: 'They already have an active membership here — removed from the waitlist', status: 409 };
    }

    const targetStatus = isFree ? 'active' : 'pending';
    const startDate = new Date().toISOString().split('T')[0];
    let membershipId = existing?.id || null;
    let holdError: { message?: string } | null = null;

    if (existing) {
        const { error } = await admin.from('memberships')
            .update({ status: targetStatus, membership_type_id: entry.membership_type_id, start_date: startDate })
            .eq('id', existing.id);
        holdError = error;
    } else {
        const { data, error } = await admin.from('memberships')
            .insert({ user_id: entry.user_id, location_id: entry.location_id, membership_type_id: entry.membership_type_id, status: targetStatus, start_date: startDate })
            .select('id')
            .single();
        holdError = error;
        membershipId = data?.id || null;
    }

    if (holdError) {
        if (holdError.message?.includes('MEMBERSHIP_TYPE_FULL')) {
            return { success: false, error: 'No free place on this membership type yet — raise its capacity or wait for a cancellation', full: true, status: 409 };
        }
        return { success: false, error: holdError.message || 'Could not hold a place', status: 500 };
    }

    if (isFree) {
        await admin.from('waitlist').delete().eq('id', entry.id);
        if (ctx.recipientEmail) {
            await sendEmail({
                to: ctx.recipientEmail,
                subject: `Your place at ${ctx.locationName} is confirmed!`,
                html: renderMembershipActivatedEmail({
                    firstName: ctx.greetingName, locationName: ctx.locationName, membershipType: ctx.membershipType,
                    price: ctx.price ? `£${ctx.price}/month` : 'Free',
                    startDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                }),
                replyTo: 'sportofkings786@gmail.com',
            });
            await logEmail(admin, entry.user_id, 'waitlist_activated', ctx.recipientEmail, actor.id, actor.name);
        }
        return { success: true, mode: 'activated', recipient: ctx.recipientEmail };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OFFER_HOURS * 3600 * 1000).toISOString();
    await admin.from('waitlist').update({
        status: 'offered', offered_at: now.toISOString(), offer_expires_at: expiresAt, reminder_sent_at: null, membership_id: membershipId,
    }).eq('id', entry.id);

    if (ctx.recipientEmail) {
        await sendEmail({
            to: ctx.recipientEmail,
            subject: `A place has opened up for you at ${ctx.locationName}! 🎉`,
            html: renderWaitlistOfferEmail({
                firstName: ctx.greetingName, memberName: ctx.memberName, locationName: ctx.locationName,
                membershipType: ctx.membershipType, priceLabel: `£${ctx.price}/month`, expiresLabel: formatExpiry(expiresAt),
                payUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sportofkings.info'}/dashboard`,
            }),
            replyTo: 'sportofkings786@gmail.com',
        });
        await logEmail(admin, entry.user_id, 'waitlist_offer', ctx.recipientEmail, actor.id, actor.name);
    }

    return { success: true, mode: 'offered', expiresAt, recipient: ctx.recipientEmail };
}
