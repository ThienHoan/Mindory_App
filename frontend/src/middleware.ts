import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // Build a Supabase client scoped to this request
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Use getUser() — verifies token with Supabase auth server (unlike getSession which reads cookie only)
    const { data: { user } } = await supabase.auth.getUser()
    const role = user?.app_metadata?.role

    if (!user || role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

// Only run this middleware on admin routes — avoids latency on all other pages
export const config = {
    matcher: ['/admin/:path*'],
}

