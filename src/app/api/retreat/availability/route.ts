import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getRetreatAvailability } from '@/lib/retreat-server';
import { LOW_AVAILABILITY_THRESHOLD } from '@/lib/retreat';

// Public endpoint. Deliberately reveals as little as possible:
// - soldOut: whether registration should be closed
// - remaining: the places-left count, but ONLY once it's low — when there's
//   plenty of room the count is withheld so abundance is never visible
export async function GET() {
    try {
        const supabase = await createAdminClient();
        const { remaining } = await getRetreatAvailability(supabase);

        const soldOut = remaining !== null && remaining <= 0;
        const showCount = remaining !== null && remaining > 0 && remaining <= LOW_AVAILABILITY_THRESHOLD;

        return NextResponse.json({
            soldOut,
            remaining: showCount ? remaining : null,
        });
    } catch (err) {
        console.error('Retreat availability error:', err);
        // Fail open: if availability can't be computed, don't block the page —
        // the register API still enforces capacity at booking time
        return NextResponse.json({ soldOut: false, remaining: null });
    }
}
