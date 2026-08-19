// Server-side retreat availability — used by the registration API (to enforce
// capacity) and the public availability API (to show places remaining).
// Call with a service-role Supabase client.

import type { SupabaseClient } from '@supabase/supabase-js';
import { RETREAT } from './retreat';

// A pending registration holds its places while its Stripe Checkout session is
// still alive (sessions are created with a 30-minute expiry).
const PENDING_HOLD_MINUTES = 35;

export interface RetreatAvailability {
    capacity: number | null; // null = unlimited
    taken: number;           // paid attendees + actively-pending holds
    remaining: number | null;
}

export async function getRetreatAvailability(supabase: SupabaseClient): Promise<RetreatAvailability> {
    const [{ data: settings }, { data: registrations }] = await Promise.all([
        supabase
            .from('retreat_settings')
            .select('capacity')
            .eq('retreat_year', RETREAT.year)
            .maybeSingle(),
        supabase
            .from('retreat_registrations')
            .select('adults, children_10_15, children_under_10, status, created_at')
            .eq('retreat_year', RETREAT.year)
            .in('status', ['paid', 'pending']),
    ]);

    const holdCutoff = Date.now() - PENDING_HOLD_MINUTES * 60 * 1000;

    const taken = (registrations || []).reduce((sum, r) => {
        const counts = r.adults + r.children_10_15 + r.children_under_10;
        if (r.status === 'paid') return sum + counts;
        // pending: only hold places while the checkout session could still complete
        if (new Date(r.created_at).getTime() > holdCutoff) return sum + counts;
        return sum;
    }, 0);

    const capacity = settings?.capacity ?? null;

    return {
        capacity,
        taken,
        remaining: capacity === null ? null : Math.max(0, capacity - taken),
    };
}
