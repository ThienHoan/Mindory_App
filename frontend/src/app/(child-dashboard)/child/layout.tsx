'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface ChildProfile {
    avatar_url: string | null
    xp: number | null
    full_name: string | null
}

const navigation = [
    {
        name: 'Tổng quan',
        href: '/child',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
        ),
    },
    {
        name: 'Bài học',
        href: '/child/lesson',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        name: 'Kiểm tra',
        href: '/child/quiz',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        name: 'Mini game',
        href: '/child/games',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 009 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
        ),
    },
    {
        name: 'Hồ sơ',
        href: '/child/profile',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
]

export default function ChildLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<ChildProfile | null>(null)
    const [xp, setXp] = useState(0)

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
                setXp(data?.xp || 0)
            }
        }
        getProfile()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f7ff' }}>
            {/* Sidebar */}
            <aside className="hidden md:flex h-full w-56 flex-col bg-white border-r border-purple-100/50 shadow-sm">
                {/* Logo */}
                <div className="flex h-16 items-center px-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
                            <span className="text-base">📚</span>
                        </div>
                        <span className="text-base font-black text-purple-700 tracking-tight">GÓC HỌC TẬP</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/child' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200',
                                    isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                        : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                                )}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Shop Card at bottom */}
                <div className="p-4">
                    <div className="rounded-2xl bg-purple-600 p-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-1">SHOP ĐỔI QUÀ</p>
                        <button className="w-full mt-2 py-2.5 bg-white text-purple-600 rounded-xl text-sm font-black hover:bg-purple-50 transition-all active:scale-95">
                            Đổi quà ngay
                        </button>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-purple-100/50 flex items-center justify-between px-8 shrink-0 shadow-sm">
                    {/* Greeting */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-lg">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : '👧'}
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-800">
                                Chào bé yêu, hôm nay mình học gì nào? ✨
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">Cùng khám phá những điều thú vị nhé!</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* XP badge */}
                        <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
                            <span className="text-base">⭐</span>
                            <span className="text-xs font-black text-yellow-600">{xp} XP</span>
                        </div>
                        {/* Bell */}
                        <button className="relative p-2 rounded-full hover:bg-purple-50 transition-colors">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-white"></span>
                        </button>
                        {/* Profile */}
                        <Link href="/child/profile" className="w-9 h-9 rounded-full overflow-hidden bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-base hover:ring-2 hover:ring-purple-400 transition-all">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : '👧'}
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
