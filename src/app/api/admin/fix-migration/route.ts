
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
    try {
        console.log('Starting retrospective migration via API...');

        // Find candidate profiles: is_child=true
        const { data: candidates, error } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id, first_name, last_name, email, parent_guardian_id')
            .eq('is_child', true);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const results = [];

        for (const candidate of candidates || []) {
            // Check if anyone points to this candidate as guardian (and is NOT the candidate themselves)
            const { count } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('parent_guardian_id', candidate.id)
                .neq('id', candidate.id);

            if (count && count > 0) {
                console.log(`Migrating ${candidate.first_name}...`);
                const result = await performMigration(candidate);
                results.push(result);
            }
        }

        return NextResponse.json({
            success: true,
            migrated_count: results.length,
            results
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function performMigration(currentProfile: any) {
    try {
        // 1. Create Phantom Auth User
        const childEmail = `child-${Date.now()}-${Math.random().toString(36).substring(7)}@child.sport-of-kings.local`;
        const childPassword = crypto.randomUUID();

        const { data: childAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: childEmail,
            password: childPassword,
            email_confirm: true,
            user_metadata: {
                first_name: currentProfile.first_name,
                last_name: currentProfile.last_name,
                is_child: true,
                migrated_from: currentProfile.user_id
            },
        });

        if (authError || !childAuth.user) throw new Error('Auth creation failed: ' + authError?.message);

        // 2. Create New Profile (Copy data)
        const { data: currentFullProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', currentProfile.id)
            .single();


        const { data: newChildProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                user_id: childAuth.user.id,
                first_name: currentFullProfile.first_name,
                last_name: currentFullProfile.last_name,
                email: childEmail,
                date_of_birth: currentFullProfile.date_of_birth,
                gender: currentFullProfile.gender,
                phone: currentFullProfile.phone,
                address: currentFullProfile.address,
                city: currentFullProfile.city,
                postcode: currentFullProfile.postcode,
                emergency_contact_name: currentFullProfile.emergency_contact_name,
                emergency_contact_phone: currentFullProfile.emergency_contact_phone,
                medical_info: currentFullProfile.medical_info,
                is_child: true,
                role: 'member',
                belt_rank: currentFullProfile.belt_rank,
                stripes: currentFullProfile.stripes,
                profile_image_url: currentFullProfile.profile_image_url,
                parent_guardian_id: currentProfile.id, // Current ID will become Guardian
                best_practice_accepted: currentFullProfile.best_practice_accepted,
                waiver_accepted: currentFullProfile.waiver_accepted
            })
            .select()
            .single();

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
            throw new Error('Profile creation failed: ' + profileError.message);
        }

        // 3. Move Linked Data
        // Attendance
        await supabaseAdmin.from('attendance_records').update({ student_id: newChildProfile.id }).eq('student_id', currentProfile.id);

        // Bookings
        await supabaseAdmin.from('class_bookings').update({ student_id: newChildProfile.id }).eq('student_id', currentProfile.id);

        // Memberships (Linked to User ID)
        const { data: memberships } = await supabaseAdmin.from('memberships').select('id').eq('user_id', currentProfile.user_id);
        if (memberships && memberships.length > 0) {
            await supabaseAdmin.from('memberships').update({ user_id: childAuth.user.id }).eq('user_id', currentProfile.user_id);
        }

        // 4. Convert Original Profile to Guardian
        // Restore Guardian Details from Auth Metadata
        const { data: { user: originalUser } } = await supabaseAdmin.auth.admin.getUserById(currentProfile.user_id);
        const guardianFirstName = originalUser?.user_metadata?.first_name || currentProfile.first_name;
        const guardianLastName = originalUser?.user_metadata?.last_name || currentProfile.last_name;

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_child: false,
                first_name: guardianFirstName,
                last_name: guardianLastName,
                belt_rank: 'white',
                stripes: 0,
                parent_guardian_id: null
            })
            .eq('id', currentProfile.id);

        if (updateError) throw new Error('Failed to update guardian profile: ' + updateError.message);

        return {
            original_user: currentProfile.user_id,
            new_child_id: newChildProfile.id,
            status: 'success'
        };

    } catch (e: any) {
        return {
            original_user: currentProfile.user_id,
            error: e.message
        };
    }
}
