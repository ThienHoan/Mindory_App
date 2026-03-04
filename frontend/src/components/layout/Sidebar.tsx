'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    HomeIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Tổng quan', href: '/parent', icon: HomeIcon },
    { name: 'Quản lý con', href: '/parent/children', icon: UsersIcon },
    { name: 'Giao bài tập', href: '/parent/assign', icon: ClipboardDocumentCheckIcon },
    { name: 'Báo cáo', href: '/parent/reports', icon: ChartBarIcon },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
            <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
                <h1 className="text-xl font-bold text-indigo-600">Mindory Parent</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                                        'mr-3 h-6 w-6 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t border-gray-200 p-4">
                <button
                    onClick={handleSignOut}
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                    <ArrowLeftOnRectangleIcon
                        className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-red-500"
                        aria-hidden="true"
                    />
                    Đăng xuất
                </button>
            </div>
        </div>
    )
}
