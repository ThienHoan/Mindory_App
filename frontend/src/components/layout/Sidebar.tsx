'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    HomeIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    SparklesIcon,
    ChartBarIcon,
    UserCircleIcon,
    ArrowLeftOnRectangleIcon,
    GiftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Trang chủ', href: '/parent', icon: HomeIcon },
    { name: 'Quản lý con', href: '/parent/children', icon: UsersIcon },
    { name: 'Giao bài tập', href: '/parent/assign', icon: ClipboardDocumentCheckIcon },
    { name: 'Giao bài AI', href: '/parent/pdf-quiz', icon: SparklesIcon },
    { name: 'Đổi thưởng', href: '/parent/rewards', icon: GiftIcon },
    { name: 'Báo cáo', href: '/parent/reports', icon: ChartBarIcon },
    { name: 'Hồ sơ', href: '/parent/profile', icon: UserCircleIcon },
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
        <div className="flex h-full w-64 flex-col border-r-2 border-blue-300 bg-gradient-to-b from-blue-50 to-indigo-50 shadow-lg">
            <div className="flex h-16 items-center justify-center border-b-2 border-blue-200 px-4">
                <h1 className="text-xl font-extrabold tracking-tight text-blue-600">Mindory Parent</h1>
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
                                        ? 'bg-blue-500 text-white shadow'
                                        : 'text-slate-600 hover:bg-white/80 hover:text-blue-600',
                                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500',
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
            <div className="border-t border-blue-100 p-4">
                <button
                    onClick={handleSignOut}
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                >
                    <ArrowLeftOnRectangleIcon
                        className="mr-3 h-6 w-6 flex-shrink-0 text-slate-400 group-hover:text-blue-500"
                        aria-hidden="true"
                    />
                    Đăng xuất
                </button>
            </div>
        </div>
    )
}
