import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Verify the requester is an admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, firstName, lastName, role } = body;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Use admin client to create user
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
        }

        if (!newUser.user) {
            return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
        }

        // Create profile for the user
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                user_id: newUser.user.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                role: role || 'member',
                belt_rank: 'white',
                stripes: 0,
                is_child: false,
                date_of_birth: '2000-01-01', // Default placeholder
                address: '',
                city: '',
                postcode: '',
                phone: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                best_practice_accepted: false,
                waiver_accepted: false,
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Try to clean up the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return NextResponse.json({ success: false, error: 'Failed to create user profile' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.user.id,
                email: newUser.user.email
            }
        });
    } catch (error) {
        console.error('Create user API error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
