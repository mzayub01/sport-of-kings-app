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

        // Validate and sanitize gender - only allow 'male' or 'female'
        const validGender = gender === 'male' || gender === 'female' ? gender : null;

        // Validate belt_rank - adults + kids belt ranks
        const validBeltRanks = [
            'white', 'blue', 'purple', 'brown', 'black',
            'grey', 'grey-white', 'grey-black',
            'yellow', 'yellow-white', 'yellow-black',
            'orange', 'orange-white', 'orange-black',
            'green', 'green-white', 'green-black'
        ];
        const validBeltRank = validBeltRanks.includes(beltRank) ? beltRank : 'white';

        // Use service role client for creating users/profiles
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Supabase environment variables');
            return NextResponse.json(
                { error: 'Server configuration error', details: 'Missing Supabase credentials' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Get or create the guardian profile
        // Strategy: 
        // 1. First try to find a parent profile (is_child=false) for this user
        // 2. If not found, check if the current user is a "Child" profile
        // 3. If so, perform MIGRATION: Convert this user to Guardian, move child data to new profile

        let guardianProfileId: string | null = null;

        // Step 1: Try to find a parent (non-child) profile for this user
        const { data: parentProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, is_child')
            .eq('user_id', user.id)
            .eq('is_child', false)
            .single();

        if (parentProfile) {
            guardianProfileId = parentProfile.id;
        } else {
            // Step 2: User might currently be a "Child" profile (Legacy/Child-Only Registration)
            const { data: currentChildProfile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_child', true)
                .single();

            if (currentChildProfile) {
                // Check if linked to another guardian
                if (currentChildProfile.parent_guardian_id && currentChildProfile.parent_guardian_id !== currentChildProfile.id) {
                    guardianProfileId = currentChildProfile.parent_guardian_id;
                } else {
                    // *** MIGRATION SCENARIO ***
                    console.log('Initiating Guardian Migration for user:', user.id);

                    // 1. Create Phantom Auth User for First Child
                    const childEmail = `child-${Date.now()}-${Math.random().toString(36).substring(7)}@child.sport-of-kings.local`;
                    const childPassword = crypto.randomUUID();

                    const { data: childAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
                        email: childEmail,
                        password: childPassword,
                        email_confirm: true,
                        user_metadata: {
                            first_name: currentChildProfile.first_name,
                            last_name: currentChildProfile.last_name,
                            is_child: true,
                            migrated_from: user.id
                        },
                    });

                    if (authError || !childAuth.user) {
                        throw new Error('Failed to create auth for migrated child: ' + authError?.message);
                    }

                    // 2. Create/Update the New First Child Profile (Copy data)
                    // Use upsert because the auth user creation trigger auto-creates a profile
                    const { data: newChildProfile, error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .upsert({
                            user_id: childAuth.user.id,
                            first_name: currentChildProfile.first_name,
                            last_name: currentChildProfile.last_name,
                            email: childEmail,
                            date_of_birth: currentChildProfile.date_of_birth,
                            gender: currentChildProfile.gender,
                            phone: currentChildProfile.phone,
                            address: currentChildProfile.address,
                            city: currentChildProfile.city,
                            postcode: currentChildProfile.postcode,
                            emergency_contact_name: currentChildProfile.emergency_contact_name,
                            emergency_contact_phone: currentChildProfile.emergency_contact_phone,
                            medical_info: currentChildProfile.medical_info,
                            is_child: true,
                            role: 'member',
                            belt_rank: currentChildProfile.belt_rank || 'white',
                            stripes: currentChildProfile.stripes || 0,
                            profile_image_url: currentChildProfile.profile_image_url,
                            parent_guardian_id: currentChildProfile.id, // Link to old ID (future Guardian)
                            best_practice_accepted: currentChildProfile.best_practice_accepted,
                            waiver_accepted: currentChildProfile.waiver_accepted
                        }, { onConflict: 'user_id' })
                        .select()
                        .single();

                    if (profileError) {
                        await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
                        throw new Error('Failed to create migrated child profile: ' + profileError.message);
                    }

                    // 3. Move Linked Data
                    await supabaseAdmin.from('attendance_records').update({ student_id: newChildProfile.id }).eq('student_id', currentChildProfile.id);
                    await supabaseAdmin.from('class_bookings').update({ student_id: newChildProfile.id }).eq('student_id', currentChildProfile.id);
                    await supabaseAdmin.from('memberships').update({ user_id: childAuth.user.id }).eq('user_id', user.id);

                    // 4. Convert Original Profile to Guardian
                    // Restore Guardian Details from Auth Metadata (saved during registration)
                    const guardianFirstName = user.user_metadata?.first_name || currentChildProfile.first_name; // Fallback to current if missing
                    const guardianLastName = user.user_metadata?.last_name || currentChildProfile.last_name;

                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            is_child: false,
                            first_name: guardianFirstName,
                            last_name: guardianLastName,
                            belt_rank: 'white',
                            stripes: 0,
                            parent_guardian_id: null,
                            // Retain contact info (phone/address) as they likely belong to guardian
                        })
                        .eq('id', currentChildProfile.id);

                    guardianProfileId = currentChildProfile.id;
                }
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
                gender: validGender,
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
                belt_rank: validBeltRank,
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to add child', details: errorMessage },
            { status: 500 }
        );
    }
}
