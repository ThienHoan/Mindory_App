'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    HomeIcon,
    BookOpenIcon,
    AcademicCapIcon,
    QuestionMarkCircleIcon,
    ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Tổng quan',    href: '/admin',          icon: HomeIcon },
    { name: 'Môn học',      href: '/admin/subjects',  icon: AcademicCapIcon },
    { name: 'Bài học',      href: '/admin/lessons',   icon: BookOpenIcon },
    { name: 'Quiz',         href: '/admin/quizzes',   icon: QuestionMarkCircleIcon },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 border-r border-gray-700">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-gray-700 px-4">
                <h1 className="text-xl font-bold text-white">
                    Mindory <span className="text-indigo-400">Admin</span>
                </h1>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                                        'mr-3 h-5 w-5 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-700 p-4">
                <button
                    onClick={handleSignOut}
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-red-900/40 hover:text-red-400"
                >
                    <ArrowLeftOnRectangleIcon
                        className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-400"
                        aria-hidden="true"
                    />
                    Đăng xuất
                </button>
            </div>
        </div>
    )
}
