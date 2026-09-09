import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { loadEntry, notifyJoined } from '@/lib/waitlist-server';

// Sends the "you're on the waitlist" email for an entry the caller just
// created. Registration may not have a session yet (email confirmation), so
// an entry created in the last 10 minutes is also accepted.
export async function POST(request: NextRequest) {
    try {
        const { waitlistId } = await request.json();
        if (!waitlistId) {
            return NextResponse.json({ error: 'waitlistId is required' }, { status: 400 });
        }

        const admin = await createAdminClient();
        const entry = await loadEntry(admin, waitlistId);
        if (!entry) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: row } = await admin.from('waitlist').select('created_at').eq('id', waitlistId).single();
        const isRecent = row?.created_at && Date.now() - new Date(row.created_at).getTime() < 10 * 60 * 1000;

        if (!(user && user.id === entry.user_id) && !isRecent) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await notifyJoined(admin, entry);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Waitlist notify error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
    }
}
