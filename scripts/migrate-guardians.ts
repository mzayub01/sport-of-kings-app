
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');

    for (const line of lines) {
        // Skip comments and empty lines
        if (!line || line.startsWith('#') || !line.trim()) continue;

        // Only process lines with =
        if (!line.includes('=')) continue;

        const parts = line.split('=');
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();

        // Remove inline comments
        if (value.includes('#')) {
            value = value.split('#')[0].trim();
        }

        // Remove quotes
        value = value.replace(/^["'](.*)["']$/, '$1');

        if (key && value) {
            process.env[key] = value;
            // Debug log partial key to verify loading
            const preview = value.length > 8 ? value.substring(0, 5) + '...' + value.substring(value.length - 5) : '***';
            console.log(`Loaded ${key}: Length=${value.length}, Value=${preview}`);
        }
    }
} else {
    console.error('.env.local file not found at:', envPath);
    process.exit(1);
}

// Test connection with ANON key first
console.log('Testing connection with ANON key...');
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
    const { data, error } = await supabaseAnon.from('profiles').select('count').limit(1).single();
    if (error) {
        console.error('Anon connection failed:', error.message);
    } else {
        console.log('Anon connection successful.');
    }
}

// Initialize Admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrate() {
    await testConnection();

    console.log('Starting retrospective migration...');
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Find candidate profiles: is_child=true
    const { data: candidates, error } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, parent_guardian_id')
        .eq('is_child', true);

    if (error) {
        console.error('Error fetching candidates:', error);
        return;
    }

    console.log(`Found ${candidates?.length || 0} child profiles. Checking for dependents...`);

    let migrationCount = 0;

    for (const candidate of candidates || []) {
        // Check if anyone points to this candidate as guardian (and is NOT the candidate themselves)
        const { count } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('parent_guardian_id', candidate.id)
            .neq('id', candidate.id);

        if (count && count > 0) {
            console.log(`\n---------------------------------------------------`);
            console.log(`Candidate ${candidate.first_name} ${candidate.last_name} (${candidate.id}) has ${count} dependent(s). Migrating...`);
            await performMigration(candidate);
            migrationCount++;
        }
    }

    if (migrationCount === 0) {
        console.log('No users needed migration.');
    }

    console.log(`\n---------------------------------------------------`);
    console.log(`Migration finished. Processed ${migrationCount} users.`);
}

async function performMigration(currentProfile: any) {
    try {
        console.log(`Migrating user ${currentProfile.user_id}...`);

        // 1. Create Phantom Auth User
        const childEmail = `child-${Date.now()}-${Math.random().toString(36).substring(7)}@child.sport-of-kings.local`;
        const childPassword = crypto.randomUUID();

        console.log(`Creating phantom auth user: ${childEmail}`);
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

        console.log(`Creating new child profile for ${currentProfile.first_name}...`);

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

        console.log(`New Child ID: ${newChildProfile.id}`);

        // 3. Move Linked Data
        console.log('Moving linked data...');
        // Attendance
        const { error: attError } = await supabaseAdmin.from('attendance_records').update({ student_id: newChildProfile.id }).eq('student_id', currentProfile.id);
        if (attError) console.error('Error moving attendance:', attError);

        // Bookings
        const { error: bookError } = await supabaseAdmin.from('class_bookings').update({ student_id: newChildProfile.id }).eq('student_id', currentProfile.id);
        if (bookError) console.error('Error moving bookings:', bookError);

        // Memberships (Linked to User ID)
        // Check if there is a membership first
        const { data: memberships } = await supabaseAdmin.from('memberships').select('id').eq('user_id', currentProfile.user_id);
        if (memberships && memberships.length > 0) {
            console.log(`Moving ${memberships.length} membership(s)...`);
            const { error: membError } = await supabaseAdmin.from('memberships').update({ user_id: childAuth.user.id }).eq('user_id', currentProfile.user_id);
            if (membError) console.error('Error moving memberships:', membError);
        }

        // 4. Convert Original Profile to Guardian
        console.log('Converting original profile to Guardian...');
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_child: false,
                belt_rank: 'white',
                stripes: 0,
                parent_guardian_id: null
            })
            .eq('id', currentProfile.id);

        if (updateError) throw new Error('Failed to update guardian profile: ' + updateError.message);

        console.log(`SUCCESS: Migrated ${currentProfile.first_name} ${currentProfile.last_name}`);

    } catch (e: any) {
        console.error(`FAILED to migrate ${currentProfile.id}:`, e.message);
    }
}

migrate();
