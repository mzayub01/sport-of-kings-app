import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { belt, stripes, userId } = await request.json();

        // Validate belt
        const validBelts = ['white', 'blue', 'purple', 'brown', 'black'];
        if (!validBelts.includes(belt)) {
            return NextResponse.json({ error: 'Invalid belt rank' }, { status: 400 });
        }

        // Validate stripes
        if (typeof stripes !== 'number' || stripes < 0 || stripes > 4) {
            return NextResponse.json({ error: 'Stripes must be 0-4' }, { status: 400 });
        }

        // Determine which user to update
        let targetUserId = user.id;

        // If userId is provided, check if current user is admin
        if (userId && userId !== user.id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Only admins can update other users' }, { status: 403 });
            }
            targetUserId = userId;
        }

        // Update the belt
        const { error } = await supabase
            .from('profiles')
            .update({ belt_rank: belt, stripes })
            .eq('user_id', targetUserId);

        if (error) {
            console.error('Belt update error:', error);
            return NextResponse.json({ error: 'Failed to update belt' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Belt updated successfully'
        });
    } catch (error) {
        console.error('Belt update error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
