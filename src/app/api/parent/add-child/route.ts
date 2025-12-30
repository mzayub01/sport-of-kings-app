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
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !locationId || !membershipTypeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use service role client for creating profiles
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Create child profile (no auth account - just a profile linked to parent)
        const { data: childProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                user_id: crypto.randomUUID(), // Generate a unique ID for the child profile
                first_name: firstName,
                last_name: lastName,
                email: user.email, // Use parent's email for reference
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
                parent_guardian_id: user.id, // Link to parent
                role: 'member',
                belt_rank: 'white',
                stripes: 0,
                best_practice_accepted: true,
                best_practice_accepted_at: new Date().toISOString(),
                waiver_accepted: true,
                waiver_accepted_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation error:', profileError);
            return NextResponse.json(
                { error: 'Failed to create child profile', details: profileError.message },
                { status: 500 }
            );
        }

        // Create membership for child
        const { error: membershipError } = await supabaseAdmin
            .from('memberships')
            .insert({
                user_id: childProfile.user_id,
                location_id: locationId,
                membership_type_id: membershipTypeId,
                status: 'active',
                start_date: new Date().toISOString().split('T')[0],
            });

        if (membershipError) {
            console.error('Membership creation error:', membershipError);
            // Clean up profile if membership fails
            await supabaseAdmin.from('profiles').delete().eq('id', childProfile.id);
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
