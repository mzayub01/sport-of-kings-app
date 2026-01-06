import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            phone,
            address,
            city,
            postcode,
            emergencyName,
            emergencyPhone,
            medicalInfo,
            locationId,
            membershipTypeId,
            beltRank,
            stripes,
            profileImageUrl,
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !locationId || !membershipTypeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use service role client for creating users/profiles
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Get parent's profile ID (FK references profiles.id, not user_id)
        const { data: parentProfile, error: parentError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (parentError || !parentProfile) {
            console.error('Parent profile not found:', parentError);
            return NextResponse.json(
                { error: 'Parent profile not found' },
                { status: 400 }
            );
        }

        // Generate a unique email for the child (they won't use it to log in)
        const childEmail = `child-${Date.now()}-${Math.random().toString(36).substring(7)}@child.sport-of-kings.local`;
        const childPassword = crypto.randomUUID(); // Random password - child won't use it

        // Create auth user for child (required for profile foreign key)
        const { data: childAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: childEmail,
            password: childPassword,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                is_child: true,
                parent_id: user.id,
            },
        });

        if (authError || !childAuth.user) {
            console.error('Auth creation error:', authError);
            return NextResponse.json(
                { error: 'Failed to create child account', details: authError?.message },
                { status: 500 }
            );
        }

        // Update the auto-created profile with full details
        const { data: childProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: childAuth.user.id,
                first_name: firstName,
                last_name: lastName,
                email: childEmail,
                date_of_birth: dateOfBirth,
                gender: gender || null,
                phone: phone || '',
                address: address || '',
                city: city || '',
                postcode: postcode || '',
                emergency_contact_name: emergencyName || '',
                emergency_contact_phone: emergencyPhone || '',
                medical_info: medicalInfo || null,
                is_child: true,
                parent_guardian_id: parentProfile.id, // Use parent's profile.id, not user.id
                role: 'member',
                belt_rank: beltRank || 'white',
                stripes: typeof stripes === 'number' ? stripes : 0,
                profile_image_url: profileImageUrl || null,
                best_practice_accepted: true,
                best_practice_accepted_at: new Date().toISOString(),
                waiver_accepted: true,
                waiver_accepted_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Clean up auth user if profile fails
            await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
            return NextResponse.json(
                { error: 'Failed to create child profile', details: profileError.message },
                { status: 500 }
            );
        }

        // Create membership for child
        const { error: membershipError } = await supabaseAdmin
            .from('memberships')
            .insert({
                user_id: childAuth.user.id,
                location_id: locationId,
                membership_type_id: membershipTypeId,
                status: 'active',
                start_date: new Date().toISOString().split('T')[0],
            });

        if (membershipError) {
            console.error('Membership creation error:', membershipError);
            // Clean up profile and auth if membership fails
            await supabaseAdmin.from('profiles').delete().eq('user_id', childAuth.user.id);
            await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
            return NextResponse.json(
                { error: 'Failed to create membership', details: membershipError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            child: {
                id: childProfile.id,
                user_id: childProfile.user_id,
                first_name: childProfile.first_name,
                last_name: childProfile.last_name,
            },
        });

    } catch (error) {
        console.error('Add child error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
