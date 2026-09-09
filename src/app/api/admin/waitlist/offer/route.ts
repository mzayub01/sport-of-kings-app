import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { offerPlace } from '@/lib/waitlist-server';

export async function POST(request: NextRequest) {
    try {
        const { waitlistId } = await request.json();
        if (!waitlistId) {
            return NextResponse.json({ error: 'waitlistId is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('user_id', user.id)
            .single();
        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const admin = await createAdminClient();
        const result = await offerPlace(admin, waitlistId, {
            id: user.id,
            name: `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || null,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error, full: result.full }, { status: result.status });
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Waitlist offer error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to offer place' }, { status: 500 });
    }
}
