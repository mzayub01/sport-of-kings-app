import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sweepWaitlist } from '@/lib/waitlist-server';

// Expire lapsed offers and send 24h reminders. Run by the admin waitlist page
// on load and by the offer action; idempotent.
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: adminProfile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const admin = await createAdminClient();
        const result = await sweepWaitlist(admin);
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('Waitlist sweep error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Sweep failed' }, { status: 500 });
    }
}
