import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ukDateString, ukDayOfWeek, ukMinutesOfDay, timeToMinutes } from '@/lib/dates';

// Check-in opens this many minutes before the class starts
const CHECK_IN_OPENS_BEFORE_MINS = 60;

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

        // Validate the class actually runs today and check-in is within the
        // allowed window (the UI enforces this too, but never trust the client)
        const { data: classInfo } = await supabase
            .from('classes')
            .select('id, day_of_week, start_time, end_time, is_active')
            .eq('id', classId)
            .maybeSingle();

        if (!classInfo || !classInfo.is_active) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        if (classInfo.day_of_week !== ukDayOfWeek()) {
            return NextResponse.json({ error: 'This class does not run today' }, { status: 400 });
        }

        const nowMins = ukMinutesOfDay();
        const startMins = timeToMinutes(classInfo.start_time);
        const endMins = timeToMinutes(classInfo.end_time);

        if (nowMins < startMins - CHECK_IN_OPENS_BEFORE_MINS) {
            return NextResponse.json({ error: 'Check-in opens 1 hour before class' }, { status: 400 });
        }
        if (nowMins > endMins) {
            return NextResponse.json({ error: 'This class has already ended' }, { status: 400 });
        }

        // Check if already checked in today for this class AND this profile
        const today = ukDateString();
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
