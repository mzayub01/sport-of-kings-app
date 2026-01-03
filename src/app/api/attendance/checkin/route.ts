import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { classId, profileId } = await request.json();

        if (!classId) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        // Use provided profileId or fall back to authenticated user
        let targetUserId = profileId || user.id;

        // If checking in for a different profile, validate parent-child relationship
        if (profileId && profileId !== user.id) {
            // First get the parent's profile ID (not user_id)
            const { data: parentProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!parentProfile) {
                return NextResponse.json({ error: 'Parent profile not found' }, { status: 403 });
            }

            // Check if the child profile has this parent as their guardian
            const { data: childProfile } = await supabase
                .from('profiles')
                .select('id, parent_guardian_id')
                .eq('user_id', profileId)
                .single();

            // Verify the authenticated user is the guardian of this profile
            if (!childProfile || childProfile.parent_guardian_id !== parentProfile.id) {
                return NextResponse.json({ error: 'Not authorized to check in for this profile' }, { status: 403 });
            }
        }

        // Check if already checked in today for this class AND this profile
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('class_id', classId)
            .eq('user_id', targetUserId)
            .eq('class_date', today)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Already checked in today',
                alreadyCheckedIn: true
            });
        }

        // Create attendance record for the target profile
        const { error } = await supabase
            .from('attendance')
            .insert({
                class_id: classId,
                user_id: targetUserId,
                class_date: today,
                check_in_time: new Date().toISOString(),
            });

        if (error) {
            console.error('Check-in error:', error);
            return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Checked in successfully!'
        });
    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
