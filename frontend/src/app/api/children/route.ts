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
    const { email, password, fullName, parentId, grade } = body
    const normalizedGrade = grade !== undefined ? Number(grade) : null

    if (normalizedGrade !== null && (!Number.isInteger(normalizedGrade) || normalizedGrade < 1 || normalizedGrade > 5)) {
        return NextResponse.json({ error: 'Grade must be an integer between 1 and 5' }, { status: 400 })
    }


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
            parent_id: parentId,
            grade: normalizedGrade,
        }
    })

    if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!newUser.user) {
        return NextResponse.json({ error: 'Failed to create user object' }, { status: 500 })
    }

    // 4. Persist profile explicitly to avoid role defaulting to parent in DB
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
            {
                id: newUser.user.id,
                email,
                full_name: fullName,
                role: 'child',
                parent_id: parentId,
                grade: normalizedGrade,
            },
            { onConflict: 'id' }
        )

    if (profileError) {
        console.error('Failed to persist child profile:', profileError)
        return NextResponse.json({ error: 'User created but failed to persist child profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
}
