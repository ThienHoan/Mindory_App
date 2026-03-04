import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
        childId,
        lessonId,
        sessionDuration,
        sessionsPerDay,
        startPage,
        endPage
    } = body

    // Validate inputs
    if (!childId || !lessonId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert Task
    const { data, error } = await supabase
        .from('assigned_tasks')
        .insert({
            child_id: childId,
            lesson_id: lessonId,
            assigned_by: user.id,
            session_duration_minutes: sessionDuration,
            sessions_per_day: sessionsPerDay,
            start_page: startPage,
            end_page: endPage,
            status: 'pending',
            assigned_date: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task: data })
}
