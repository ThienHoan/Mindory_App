Note: The tool simplified the command to ` cat > /Users/sonhuynh081104/Downloads/Ki7/SDN302/Mindory_App/frontend/src/app/\(child-dashboard\)/child/layout.tsx << 'ENDOFFILE'
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navigation = [
    {
        name: 'Home',
        href: '/child',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
        ),
    },
    {
        name: 'Map',
        href: '/child/map',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        ),
    },
    {
        name: 'Library',
        href: '/child/library',
        badge: 3,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        name: 'Awards',
        href: '/child/awards',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        ),
    },
    {
        name: 'Profile',
        href: '/child/profile',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
]

export default function ChildLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <div className="flex h-full w-56 flex-col bg-white border-r border-gray-100 shadow-lg">
                {/* Logo */}
                <div className="flex h-16 items-center px-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="text-xl">🚀</span>
                        </div>
                        <div>
                            <span className="text-base font-extrabold text-white">KidsLearn</span>
                            <p className="text-[10px] text-blue-200 font-semibold leading-none tracking-widest">EXPLORER</p>
                        </div>
                    </div>
                </div>

                {/* Streak banner */}
                <div className="mx-3 mt-3 bg-gradient-to-r from-orange-400 to-rose-500 rounded-xl p-2.5 flex items-center gap-2 shadow-sm shadow-orange-200">
                    <span className="text-xl">🔥</span>
                    <div>
                        <p className="text-white text-xs font-bold leading-none">24 Day Streak!</p>
                        <p className="text-orange-100 text-[10px] leading-none mt-0.5">Keep it going today!</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/child' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200'
                                        : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(isActive ? 'text-white' : 'text-gray-400')}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </div>
                                {'badge' in item && item.badge && !isActive && (
                                    <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom panel */}
                <div className="p-3 border-t border-gray-100 space-y-3">
                    {/* XP bar */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <span className="text-xs">⚡</span>
                                </div>
                                <span className="text-xs font-bold text-gray-700">Level 12</span>
                            </div>
                            <span className="text-xs font-semibold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">750 XP</span>
                        </div>
                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                                style={{ width: '75%' }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-right">250 XP to Level 13</p>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-sm">
                                <span className="text-sm">⭐</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 leading-none">Stars</p>
                                <p className="text-sm font-extrabold text-gray-800">1,250</p>
                            </div>
                        </div>
                        <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform">
                            Shop 🛍️
                        </button>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5 flex items-center justify-center gap-1 hover:bg-red-50 rounded-lg"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
ENDOFFILE`, and this is the output of running that command instead:
sonhuynh081104@Huynhs-MacBook-Pro Mindory_App %  cat > /Users/sonhuynh081104/Dow
nloads/Ki7/SDN302/Mindory_App/frontend/src/app/\(child-dashboard\)/child/layout.
tsx << 'ENDOFFILE'
heredoc> 'use client'
heredoc> 
heredoc> import Link from 'next/link'
heredoc> import { usePathname, useRouter } from 'next/navigation'
heredoc> import { createClient } from '@/lib/supabase/client'
heredoc> import { cn } from '@/lib/utils'
heredoc> 
heredoc> const navigation = [
heredoc>     {
heredoc>         name: 'Home',
heredoc>         href: '/child',
heredoc>         icon: (
heredoc>             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 2
0 20">
heredoc>                 <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.
414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1
 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
heredoc>             </svg>
heredoc>         ),
heredoc>     },
heredoc>     {
heredoc>         name: 'Map',
heredoc>         href: '/child/map',
heredoc>         icon: (
heredoc>             <svg className="w-5 h-5" fill="none" stroke="currentColor" 
strokeWidth={2} viewBox="0 0 24 24">
heredoc>                 <path strokeLinecap="round" strokeLinejoin="round" d="M
9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m
6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
 />
heredoc>             </svg>
heredoc>         ),
heredoc>     },
heredoc>     {
heredoc>         name: 'Library',
heredoc>         href: '/child/library',
heredoc>         badge: 3,
heredoc>         icon: (
heredoc>             <svg className="w-5 h-5" fill="none" stroke="currentColor" 
strokeWidth={2} viewBox="0 0 24 24">
heredoc>                 <path strokeLinecap="round" strokeLinejoin="round" d="M
12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 
5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.
332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.25
3" />
heredoc>             </svg>
heredoc>         ),
heredoc>     },
heredoc>     {
heredoc>         name: 'Awards',
heredoc>         href: '/child/awards',
heredoc>         icon: (
heredoc>             <svg className="w-5 h-5" fill="none" stroke="currentColor" 
strokeWidth={2} viewBox="0 0 24 24">
heredoc>                 <path strokeLinecap="round" strokeLinejoin="round" d="M
5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857
L5 12l5.714-2.143L13 3z" />
heredoc>             </svg>
heredoc>         ),
heredoc>     },
heredoc>     {
heredoc>         name: 'Profile',
heredoc>         href: '/child/profile',
heredoc>         icon: (
heredoc>             <svg className="w-5 h-5" fill="none" stroke="currentColor" 
strokeWidth={2} viewBox="0 0 24 24">
heredoc>                 <path strokeLinecap="round" strokeLinejoin="round" d="M
16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
heredoc>             </svg>
heredoc>         ),
heredoc>     },
heredoc> ]
heredoc> 
heredoc> export default function ChildLayout({ children }: { children: React.Rea
ctNode }) {
heredoc>     const pathname = usePathname()
heredoc>     const router = useRouter()
heredoc>     const supabase = createClient()
heredoc> 
heredoc>     const handleSignOut = async () => {
heredoc>         await supabase.auth.signOut()
heredoc>         router.refresh()
heredoc>         router.push('/login')
heredoc>     }
heredoc> 
heredoc>     return (
heredoc>         <div className="flex h-screen overflow-hidden bg-slate-50">
heredoc>             {/* Sidebar */}
heredoc>             <div className="flex h-full w-56 flex-col bg-white border-r
 border-gray-100 shadow-lg">
heredoc>                 {/* Logo */}
heredoc>                 <div className="flex h-16 items-center px-4 border-b bo
rder-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
heredoc>                     <div className="flex items-center gap-2.5">
heredoc>                         <div className="w-9 h-9 rounded-xl bg-white/20 
flex items-center justify-center">
heredoc>                             <span className="text-xl">🚀</span>
heredoc>                         </div>
heredoc>                         <div>
heredoc>                             <span className="text-base font-extrabold t
ext-white">KidsLearn</span>
heredoc>                             <p className="text-[10px] text-blue-200 fon
t-semibold leading-none tracking-widest">EXPLORER</p>
heredoc>                         </div>
heredoc>                     </div>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Streak banner */}
heredoc>                 <div className="mx-3 mt-3 bg-gradient-to-r from-orange-
400 to-rose-500 rounded-xl p-2.5 flex items-center gap-2 shadow-sm shadow-orange
-200">
heredoc>                     <span className="text-xl">🔥</span>
heredoc>                     <div>
heredoc>                         <p className="text-white text-xs font-bold lead
ing-none">24 Day Streak!</p>
heredoc>                         <p className="text-orange-100 text-[10px] leadi
ng-none mt-0.5">Keep it going today!</p>
heredoc>                     </div>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Navigation */}
heredoc>                 <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y
-auto">
heredoc>                     {navigation.map((item) => {
heredoc>                         const isActive = pathname === item.href ||
heredoc>                             (item.href !== '/child' && pathname.startsW
ith(item.href))
heredoc>                         return (
heredoc>                             <Link
heredoc>                                 key={item.name}
heredoc>                                 href={item.href}
heredoc>                                 className={cn(
heredoc>                                     'flex items-center justify-between 
px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
heredoc>                                     isActive
heredoc>                                         ? 'bg-gradient-to-r from-blue-5
00 to-indigo-500 text-white shadow-md shadow-blue-200'
heredoc>                                         : 'text-gray-500 hover:bg-blue-
50 hover:text-blue-600'
heredoc>                                 )}
heredoc>                             >
heredoc>                                 <div className="flex items-center gap-3
">
heredoc>                                     <span className={cn(isActive ? 'tex
t-white' : 'text-gray-400')}>
heredoc>                                         {item.icon}
heredoc>                                     </span>
heredoc>                                     {item.name}
heredoc>                                 </div>
heredoc>                                 {'badge' in item && item.badge && !isAc
tive && (
heredoc>                                     <span className="bg-red-500 text-wh
ite text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">

heredoc>                                         {item.badge}
heredoc>                                     </span>
heredoc>                                 )}
heredoc>                             </Link>
heredoc>                         )
heredoc>                     })}
heredoc>                 </nav>
heredoc> 
heredoc>                 {/* Bottom panel */}
heredoc>                 <div className="p-3 border-t border-gray-100 space-y-3"
>
heredoc>                     {/* XP bar */}
heredoc>                     <div className="bg-gradient-to-br from-blue-50 to-i
ndigo-50 rounded-xl p-3 border border-blue-100">
heredoc>                         <div className="flex items-center justify-betwe
en mb-2">
heredoc>                             <div className="flex items-center gap-1.5">

heredoc>                                 <div className="w-6 h-6 rounded-lg bg-b
lue-500 flex items-center justify-center">
heredoc>                                     <span className="text-xs">⚡</span>

heredoc>                                 </div>
heredoc>                                 <span className="text-xs font-bold text
-gray-700">Level 12</span>
heredoc>                             </div>
heredoc>                             <span className="text-xs font-semibold text
-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">750 XP</span>
heredoc>                         </div>
heredoc>                         <div className="h-2 bg-blue-100 rounded-full ov
erflow-hidden">
heredoc>                             <div
heredoc>                                 className="h-full rounded-full bg-gradi
ent-to-r from-blue-400 to-indigo-500"
heredoc>                                 style={{ width: '75%' }}
heredoc>                             />
heredoc>                         </div>
heredoc>                         <p className="text-[10px] text-gray-400 mt-1 te
xt-right">250 XP to Level 13</p>
heredoc>                     </div>
heredoc> 
heredoc>                     {/* Stars */}
heredoc>                     <div className="flex items-center justify-between">

heredoc>                         <div className="flex items-center gap-2">
heredoc>                             <div className="w-8 h-8 rounded-xl bg-gradi
ent-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-
sm">
heredoc>                                 <span className="text-sm">⭐</span>
heredoc>                             </div>
heredoc>                             <div>
heredoc>                                 <p className="text-[10px] text-gray-400
 leading-none">Stars</p>
heredoc>                                 <p className="text-sm font-extrabold te
xt-gray-800">1,250</p>
heredoc>                             </div>
heredoc>                         </div>
heredoc>                         <button className="bg-gradient-to-r from-blue-5
00 to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm a
ctive:scale-95 transition-transform">
heredoc>                             Shop🛍️🛍
heredoc>                         </button>
heredoc>                     </div>
heredoc> 
heredoc>                     <button
heredoc>                         onClick={handleSignOut}
heredoc>                         className="w-full text-xs text-gray-400 hover:t
ext-red-500 transition-colors py-1.5 flex items-center justify-center gap-1 hove
r:bg-red-50 rounded-lg"
heredoc>                     >
heredoc>                         <svg className="w-3.5 h-3.5" fill="none" stroke
="currentColor" strokeWidth={2} viewBox="0 0 24 24">
heredoc>                             <path strokeLinecap="round" strokeLinejoin=
"round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 0
13-3h4a3 3 0 013 3v1" />
heredoc>                         </svg>
heredoc>                         Sign Out
heredoc>                     </button>
heredoc>                 </div>
heredoc>             </div>
heredoc> 
heredoc>             {/* Main content */}
heredoc>             <div className="flex flex-1 flex-col overflow-hidden">
heredoc>                 <main className="flex-1 overflow-y-auto">
heredoc>                     {children}
heredoc>                 </main>
heredoc>             </div>
heredoc>         </div>
heredoc>     )
heredoc> }
heredoc> ENDOFFILE
