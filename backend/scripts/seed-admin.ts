/**
 * Seed Admin Script
 * Promotes a user to admin role by:
 *   1. Looking up their id via profiles.email (avoids listUsers() pagination issues)
 *   2. Setting app_metadata.role = 'admin' on the auth user (for JWT claims)
 *   3. Updating profiles.role = 'admin' (for DB fallback in auth middleware)
 *
 * Usage:
 *   ADMIN_EMAIL=admin@mindory.com npx ts-node scripts/seed-admin.ts
 *
 * NOTE: After running this script, the user must logout and login again
 *       to receive a new JWT with the updated app_metadata.role claim.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
        console.error('❌ Missing ADMIN_EMAIL env var. Usage: ADMIN_EMAIL=admin@example.com npx ts-node scripts/seed-admin.ts');
        process.exit(1);
    }

    console.log(`🔍 Looking up user with email: ${email}`);

    // Step 1: Find profile id via profiles.email (avoids listUsers() pagination)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .single();

    if (profileError || !profile) {
        console.error(`❌ User not found in profiles table for email: ${email}`);
        console.error('   Make sure the user has signed up first.');
        process.exit(1);
    }

    if (profile.role === 'admin') {
        console.log(`⚠️  User ${email} is already admin. No changes made.`);
        process.exit(0);
    }

    console.log(`📋 Found profile id: ${profile.id} (current role: ${profile.role})`);

    // Step 2: Update app_metadata on auth user (for JWT claim — requires new login to take effect)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        app_metadata: { role: 'admin' },
    });

    if (authError) {
        console.error(`❌ Failed to update auth user app_metadata: ${authError.message}`);
        process.exit(1);
    }

    // Step 3: Update profiles table (for DB fallback in auth middleware)
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id);

    if (updateError) {
        console.error(`❌ Failed to update profiles table: ${updateError.message}`);
        process.exit(1);
    }

    console.log(`✅ Successfully promoted ${email} to admin.`);
    console.log(`⚠️  IMPORTANT: User must logout and login again to receive a new JWT with admin role.`);
}

seedAdmin();
