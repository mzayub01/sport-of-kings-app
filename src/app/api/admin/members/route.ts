import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user and verify admin role
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin role
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!adminProfile || adminProfile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Use service role client for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Delete related records first (memberships, attendance, etc.)
        await supabaseAdmin.from('attendance').delete().eq('user_id', userId);
        await supabaseAdmin.from('memberships').delete().eq('user_id', userId);

        // Delete the profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('user_id', userId);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            return NextResponse.json(
                { error: 'Failed to delete profile', details: profileError.message },
                { status: 500 }
            );
        }

        // Delete the auth user
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            return NextResponse.json(
                { error: 'Failed to delete auth user', details: authError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Member deleted successfully' });

    } catch (error) {
        console.error('Delete member error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
