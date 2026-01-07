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

        // Get or create the guardian profile
        // Strategy: 
        // 1. First try to find a parent profile (is_child=false) for this user
        // 2. If not found, this user might only have a child profile - find the guardian via parent_guardian_id
        // 3. If still no guardian exists, create one from the child's guardian details

        let guardianProfileId: string | null = null;

        // Step 1: Try to find a parent (non-child) profile for this user
        const { data: parentProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_child', false)
            .single();

        if (parentProfile) {
            guardianProfileId = parentProfile.id;
        } else {
            // Step 2: User might only have a child profile - find their guardian
            const { data: childProfile } = await supabaseAdmin
                .from('profiles')
                .select('id, parent_guardian_id, phone, address, city, postcode, emergency_contact_name, emergency_contact_phone')
                .eq('user_id', user.id)
                .eq('is_child', true)
                .single();

            if (childProfile?.parent_guardian_id) {
                // Guardian already exists - use it
                guardianProfileId = childProfile.parent_guardian_id;
            } else if (childProfile) {
                // Step 3: No guardian exists - create a guardian profile
                // The guardian details are stored on the child profile, so create a guardian from those
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
                const guardianEmail = authUser?.user?.email || `guardian-${Date.now()}@guardian.sport-of-kings.local`;
                const guardianName = authUser?.user?.user_metadata?.first_name || 'Guardian';
                const guardianLastName = authUser?.user?.user_metadata?.last_name || '';

                // Create guardian profile
                const { data: newGuardian, error: guardianError } = await supabaseAdmin
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        first_name: guardianName,
                        last_name: guardianLastName,
                        email: guardianEmail,
                        phone: childProfile.phone || phone || '',
                        address: childProfile.address || address || '',
                        city: childProfile.city || city || '',
                        postcode: childProfile.postcode || postcode || '',
                        emergency_contact_name: childProfile.emergency_contact_name || emergencyName || '',
                        emergency_contact_phone: childProfile.emergency_contact_phone || emergencyPhone || '',
                        is_child: false,
                        role: 'member',
                    })
                    .select('id')
                    .single();

                if (guardianError || !newGuardian) {
                    console.error('Failed to create guardian profile:', guardianError);
                    return NextResponse.json(
                        { error: 'Failed to create guardian profile', details: guardianError?.message },
                        { status: 500 }
                    );
                }

                guardianProfileId = newGuardian.id;

                // Update existing child profile to point to new guardian
                await supabaseAdmin
                    .from('profiles')
                    .update({ parent_guardian_id: guardianProfileId })
                    .eq('id', childProfile.id);
            }
        }

        if (!guardianProfileId) {
            console.error('Could not find or create guardian profile');
            return NextResponse.json(
                { error: 'Guardian profile not found' },
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
                parent_guardian_id: guardianProfileId, // Link to guardian profile
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

        // Fetch membership type to check if it's paid
        const { data: membershipType } = await supabaseAdmin
            .from('membership_types')
            .select('name, price')
            .eq('id', membershipTypeId)
            .single();

        const isFree = !membershipType || membershipType.price === 0;

        // Fetch location to check for Cheadle Masjid exception
        const { data: locationData } = await supabaseAdmin
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();

        const isCheadleMasjid = locationData?.name?.toLowerCase().includes('cheadle masjid') ||
            locationData?.name?.toLowerCase().includes('cheadle mosque');

        // Determine membership status based on payment type
        const membershipStatus = (isFree || isCheadleMasjid) ? 'active' : 'pending';

        // Create membership for child
        const { error: membershipError } = await supabaseAdmin
            .from('memberships')
            .insert({
                user_id: childAuth.user.id,
                location_id: locationId,
                membership_type_id: membershipTypeId,
                status: membershipStatus,
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
            // Include info for client to handle payment
            requiresPayment: !isFree && !isCheadleMasjid,
            isCheadleMasjid,
            membershipType: {
                id: membershipTypeId,
                name: membershipType?.name || 'Membership',
                price: membershipType?.price || 0,
            },
            location: {
                id: locationId,
                name: locationData?.name || '',
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
