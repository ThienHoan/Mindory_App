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
        <div role="banner" className="flex h-16 flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex flex-1">
                    {/* Add search or other nav items here if needed */}
                </div>
                <div className="ml-4 flex items-center md:ml-6">
                    <div className="flex items-center">
                        {user?.user_metadata?.full_name && (
                            <span className="mr-4 text-sm font-medium text-gray-700">
                                Xin chào, {user.user_metadata.full_name}
                            </span>
                        )}
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
