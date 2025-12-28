import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is professor or admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'professor' && profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Not authorized to grade' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, classId, previousBelt, previousStripes, newBelt, newStripes, comments } = body;

        if (!userId || !classId || !newBelt) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // For professors (not admin), verify access to the class
        if (profile?.role === 'professor') {
            const { data: access } = await supabase
                .from('professor_class_access')
                .select('id')
                .eq('professor_user_id', user.id)
                .eq('class_id', classId)
                .single();

            if (!access) {
                return NextResponse.json({ success: false, error: 'Not authorized for this class' }, { status: 403 });
            }
        }

        // Create promotion record
        const { error: promotionError } = await supabase
            .from('promotions')
            .insert({
                user_id: userId,
                promoted_by: user.id,
                class_id: classId,
                previous_belt: previousBelt,
                previous_stripes: previousStripes,
                new_belt: newBelt,
                new_stripes: newStripes,
                comments,
                promotion_date: new Date().toISOString().split('T')[0],
            });

        if (promotionError) {
            console.error('Error creating promotion:', promotionError);
            return NextResponse.json({ success: false, error: 'Failed to save promotion' }, { status: 500 });
        }

        // Update member's belt rank and stripes
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                belt_rank: newBelt,
                stripes: newStripes,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json({ success: false, error: 'Failed to update member profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Promotion API error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
