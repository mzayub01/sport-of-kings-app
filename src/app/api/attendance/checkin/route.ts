import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { classId } = await request.json();

        if (!classId) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }

        // Check if already checked in today for this class
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('class_id', classId)
            .eq('user_id', user.id)
            .eq('class_date', today)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Already checked in today',
                alreadyCheckedIn: true
            });
        }

        // Create attendance record
        const { error } = await supabase
            .from('attendance')
            .insert({
                class_id: classId,
                user_id: user.id,
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
