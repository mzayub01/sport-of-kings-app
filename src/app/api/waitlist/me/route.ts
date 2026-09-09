import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sweepWaitlist, queueRank, type WaitlistEntry } from '@/lib/waitlist-server';

// The signed-in member's waitlist entries (their own and their children's),
// with a transparent queue position. Runs the expiry sweep first so a lapsed
// offer is never shown as live.
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await createAdminClient();
        await sweepWaitlist(admin);

        const { data: me } = await admin.from('profiles').select('id, email, first_name').eq('user_id', user.id).maybeSingle();
        const { data: children } = me
            ? await admin.from('profiles').select('user_id, first_name, last_name').eq('parent_guardian_id', me.id)
            : { data: [] };

        const userIds = [user.id, ...(children || []).map((c: { user_id: string }) => c.user_id)];
        const childName = new Map<string, string>((children || []).map((c: { user_id: string; first_name: string; last_name: string }) => [c.user_id, `${c.first_name} ${c.last_name}`] as [string, string]));

        const { data: entries } = await admin
            .from('waitlist')
            .select('id, user_id, location_id, membership_type_id, position, status, offered_at, offer_expires_at, joined_at, location:locations(name), membership_type:membership_types(name, price)')
            .in('user_id', userIds)
            .order('joined_at');

        const result: Array<Record<string, unknown>> = [];
        for (const e of (entries || []) as any[]) {
            result.push({
                id: e.id,
                userId: e.user_id,
                memberName: childName.get(e.user_id) || null,
                locationId: e.location_id,
                locationName: e.location?.name || 'Sport of Kings',
                membershipTypeId: e.membership_type_id,
                membershipType: e.membership_type?.name || 'Membership',
                price: e.membership_type?.price ?? 0,
                status: e.status,
                position: await queueRank(admin, e as WaitlistEntry),
                offerExpiresAt: e.offer_expires_at,
                joinedAt: e.joined_at,
                payerEmail: me?.email || user.email || '',
            });
        }

        return NextResponse.json({ entries: result });
    } catch (error) {
        console.error('Waitlist me error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load waitlist' }, { status: 500 });
    }
}
