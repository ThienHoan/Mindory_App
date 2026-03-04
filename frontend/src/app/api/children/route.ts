import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Note: This requires SERVICE_ROLE_KEY to administer users. 
// Do NOT expose service role key to client.
// We must use a separate client for admin actions.

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    // 1. Verify Parent Session first
    const supabase = await createServerClient()
    const { data: { user: parentUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !parentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Body
    const body = await request.json()
    const { email, password, fullName, parentId } = body

    if (parentId !== parentUser.id) {
        return NextResponse.json({ error: 'Mismatched Parent ID' }, { status: 403 })
    }

    // 3. Create Child User using Admin Client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirm
        user_metadata: {
            full_name: fullName,
            role: 'child',
            parent_id: parentId // Store link in metadata as backup
        }
    })

    if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!newUser.user) {
        return NextResponse.json({ error: 'Failed to create user object' }, { status: 500 })
    }

    // 4. Update Profile with Parent ID (Triggers might handle role/metadata, but parent_id needs setting)
    // Our trigger `handle_new_user` sets role based on metadata.
    // We need to ensuring `parent_id` is set on the 'profiles' table.

    // The trigger handles the INSERT into profiles. 
    // We need to UPDATE that profile to set parent_id.

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ parent_id: parentId })
        .eq('id', newUser.user.id)

    if (updateError) {
        // Log error but user is created.
        console.error('Failed to link parent:', updateError)
        return NextResponse.json({ error: 'User created but failed to link parent' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
}
