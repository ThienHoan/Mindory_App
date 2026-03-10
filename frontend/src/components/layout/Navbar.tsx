'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [supabase])

    return (
        <div
            role="banner"
            className="flex h-20 flex-shrink-0 border-b-2 border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 rounded-bl-3xl shadow-md"
        >
            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex flex-1 items-center">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-blue-600 sm:text-2xl">Chào phụ huynh!</h1>
                        <p className="text-xs text-blue-500 sm:text-sm">Hôm nay con của bạn đã hoàn thành 3 nhiệm vụ.</p>
                    </div>
                </div>
                <div className="ml-4 flex items-center md:ml-6">
                    <div className="flex items-center">
                        {user?.user_metadata?.full_name && (
                            <span className="mr-4 text-sm font-semibold text-slate-700">
                                Xin chào, {user.user_metadata.full_name}
                            </span>
                        )}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
