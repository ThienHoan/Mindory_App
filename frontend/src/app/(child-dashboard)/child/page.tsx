Note: The tool simplified the command to ` python3 << 'PYEOF'
content = r"""import Link from 'next/link'

const quests = [
    {
        id: 1,
        title: 'The Mystery of the Blue Whale',
        description: 'Join Captain Blue on an underwater adventure to discover the secrets of the deep ocean.',
        tag: 'READING',
        tagColor: 'bg-blue-500',
        meta: '15 MINS',
        metaBg: 'bg-black/30',
        xp: '+50 XP',
        btnLabel: 'Start Reading',
        gradient: 'from-slate-700 via-blue-900 to-slate-800',
        emoji: '🐋',
        href: '/child/lesson',
        difficulty: 'Easy',
        diffColor: 'text-green-300',
    },
    {
        id: 2,
        title: 'Number Wizards Challenge',
        description: 'Test your skills in addition and subtraction to help the Number Wizards save the day!',
        tag: 'MATH',
        tagColor: 'bg-emerald-500',
        meta: 'LEVEL 2',
        metaBg: 'bg-emerald-700/50',
        xp: '+75 XP',
        btnLabel: 'Solve Now',
        gradient: 'from-teal-500 via-emerald-600 to-green-700',
        emoji: '🧙',
        href: '/child/lesson',
        difficulty: 'Medium',
        diffColor: 'text-yellow-300',
    },
    {
        id: 3,
        title: 'Mars Base Explorer',
        description: 'Learn about gravity and life on Mars as you design your own space base from scratch.',
        tag: 'SCIENCE',
        tagColor: 'bg-violet-500',
        meta: 'NEW',
        metaBg: 'bg-violet-700/50',
        xp: '+100 XP',
        btnLabel: 'Blast Off',
        gradient: 'from-slate-700 via-purple-900 to-indigo-900',
        emoji: '🚀',
        href: '/child/lesson',
        difficulty: 'Hard',
        diffColor: 'text-red-300',
    },
]

const subjects = [
    { name: 'Math', emoji: '🔢', color: 'from-emerald-400 to-teal-500', count: 12, href: '/child/library' },
    { name: 'Reading', emoji: '📖', color: 'from-blue-400 to-indigo-500', count: 8, href: '/child/library' },
    { name: 'Science', emoji: '🔬', color: 'from-purple-400 to-violet-500', count: 6, href: '/child/library' },
    { name: 'Art', emoji: '🎨', color: 'from-pink-400 to-rose-500', count: 4, href: '/child/library' },
]

const achievements = [
    { id: 1, emoji: '🌟', iconBg: 'bg-yellow-50 border-yellow-200', title: '7 Day Streak', desc: 'Unlocked yesterday', unlocked: true, xp: '+50 XP' },
    { id: 2, emoji: '📚', iconBg: 'bg-blue-50 border-blue-200', title: 'Speed Reader', desc: 'Finished 5 books this week', unlocked: true, xp: '+30 XP' },
    { id: 3, emoji: '🏅', iconBg: 'bg-gray-50 border-gray-200', title: 'Math Master', desc: 'Complete 3 more Math Quests', unlocked: false, xp: '+100 XP' },
]

const leaderboard = [
    { rank: 1, name: 'Sophie', xp: 1450, avatar: 'bg-pink-400', delta: '+12' },
    { rank: 2, name: 'Alex', xp: 1250, avatar: 'bg-blue-400', delta: '+8', isMe: true },
    { rank: 3, name: 'Marcus', xp: 1100, avatar: 'bg-green-400', delta: '+5' },
    { rank: 4, name: 'Luna', xp: 980, avatar: 'bg-purple-400', delta: '+2' },
]

export default function ChildHomePage() {
    return (
        <div className="min-h-full bg-slate-50">
            {/* Top Navbar */}
            <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search for games or books..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                    {/* XP pill */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                        <span className="text-sm">⭐</span>
                        <span className="text-xs font-bold text-yellow-700">1,250</span>
                    </div>
                    <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <Link href="/child/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-none">Alex</p>
                            <p className="text-[10px] text-gray-400 font-medium">Grade 2 · Explorer</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            A
                        </div>
                    </Link>
                </div>
            </header>

            <div className="p-5 space-y-6">
                {/* Welcome banner */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-blue-200">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 right-16 w-20 h-20 bg-white/10 rounded-full translate-y-6" />
                    <div className="absolute top-4 right-32 w-10 h-10 bg-white/10 rounded-full" />

                    <div className="relative flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
                            🎓
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-blue-200 text-xs font-semibold tracking-widest mb-0.5">WELCOME BACK</p>
                            <h2 className="text-2xl font-extrabold leading-tight">Hello, Alex! 👋</h2>
                            <p className="text-blue-100 text-sm mt-0.5">Level 12 Explorer · You&apos;re doing amazing!</p>
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-blue-200">PROGRESS TO LEVEL 13</span>
                                    <span className="text-xs font-bold text-white">750 / 1000 XP</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: '75%' }} />
                                </div>
                                <p className="text-[10px] text-blue-200 mt-1">250 XP left · Unlock the Space Explorer badge!</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <div className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-center min-w-16">
                                <p className="text-2xl font-extrabold">12</p>
                                <p className="text-[9px] text-blue-200 font-bold tracking-wider">LEVEL</p>
                            </div>
                            <div className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-center">
                                <p className="text-2xl font-extrabold">🔥24</p>
                                <p className="text-[9px] text-blue-200 font-bold tracking-wider">STREAK</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject quick access */}
                <div>
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                        📂 <span>Browse by Subject</span>
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {subjects.map((s) => (
                            <Link
                                key={s.name}
                                href={s.href}
                                className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mx-auto mb-2 shadow-sm group-hover:scale-110 transition-transform`}>
                                    {s.emoji}
                                </div>
                                <p className="text-sm font-bold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.count} lessons</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Daily Challenge */}
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-orange-200">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
                        ⚡
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-orange-100 tracking-widest">DAILY CHALLENGE</span>
                            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">⏱ 23:45 left</span>
                        </div>
                        <h4 className="text-white font-extrabold text-base leading-tight">Quick Math: Count the Stars!</h4>
                        <p className="text-orange-100 text-xs mt-0.5">Complete for double XP bonus today</p>
                    </div>
                    <Link
                        href="/child/lesson"
                        className="bg-white text-orange-500 font-extrabold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap shadow-sm flex-shrink-0"
                    >
                        Play Now 🎯
                    </Link>
                </div>

                {/* Quests + Leaderboard */}
                <div className="grid grid-cols-3 gap-5">
                    {/* Quests - takes 2 cols */}
                    <div className="col-span-2">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
                                ✨ <span>Your Quests for Today</span>
                            </h3>
                            <Link href="/child/library" className="text-xs font-bold text-blue-500 hover:text-blue-600 bg-blue-50 px-3 py-1 rounded-full transition-colors">
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {quests.map((quest) => (
                                <div key={quest.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                                    <div className={`h-28 bg-gradient-to-br ${quest.gradient} relative flex items-end p-3`}>
                                        {/* Big emoji */}
                                        <div className="absolute top-3 right-4 text-4xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all">
                                            {quest.emoji}
                                        </div>
                                        <div className="relative flex items-center gap-2">
                                            <span className={`text-[10px] font-extrabold text-white px-2.5 py-1 rounded-full tracking-widest ${quest.tagColor}`}>
                                                {quest.tag}
                                            </span>
                                            <span className={`text-[10px] font-bold text-white px-2 py-1 rounded-full ${quest.metaBg}`}>
                                                {quest.meta}
                                            </span>
                                            <span className={`text-[10px] font-bold ${quest.diffColor} ml-auto`}>
                                                {quest.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm leading-snug truncate">{quest.title}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{quest.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-extrabold text-yellow-500 bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg">
                                                ⭐ {quest.xp}
                                            </span>
                                            <Link
                                                href={quest.href}
                                                className="text-white text-xs font-bold px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm active:scale-95"
                                            >
                                                {quest.btnLabel}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Leaderboard */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                    🏆 <span>Leaderboard</span>
                                </h3>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">This Week</span>
                            </div>
                            <div className="space-y-2">
                                {leaderboard.map((p) => (
                                    <div
                                        key={p.rank}
                                        className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${p.isMe ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}
                                    >
                                        <span className={`text-xs font-extrabold w-5 text-center ${p.rank === 1 ? 'text-yellow-500' : p.rank === 2 ? 'text-gray-400' : 'text-orange-400'}`}>
                                            {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                                        </span>
                                        <div className={`w-7 h-7 rounded-full ${p.avatar} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                            {p.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold leading-none ${p.isMe ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {p.name} {p.isMe && <span className="text-[9px] text-blue-400">(You)</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-400">{p.xp.toLocaleString()} XP</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-green-500">{p.delta}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Achievements */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                                🎖️ <span>Achievements</span>
                            </h3>
                            <div className="space-y-2">
                                {achievements.map((a) => (
                                    <div
                                        key={a.id}
                                        className={`flex items-center gap-2.5 p-2 rounded-xl border ${a.unlocked ? 'opacity-100' : 'opacity-50 grayscale'} ${a.iconBg}`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0 border border-gray-100">
                                            {a.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 leading-none truncate">{a.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{a.desc}</p>
                                        </div>
                                        {a.unlocked && (
                                            <span className="text-[10px] font-extrabold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                {a.xp}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
"""
open('/Users/sonhuynh081104/Downloads/Ki7/SDN302/Mindory_App/frontend/src/app/(child-dashboard)/child/page.tsx', 'w').write(content)
print('done', len(content))
PYEOF`, and this is the output of running that command instead:
sonhuynh081104@Huynhs-MacBook-Pro Mindory_App %  python3 << 'PYEOF'
heredoc> content = r"""import Link from 'next/link'
heredoc> 
heredoc> const quests = [
heredoc>     {
heredoc>         id: 1,
heredoc>         title: 'The Mystery of the Blue Whale',
heredoc>         description: 'Join Captain Blue on an underwater adventure to d
iscover the secrets of the deep ocean.',
heredoc>         tag: 'READING',
heredoc>         tagColor: 'bg-blue-500',
heredoc>         meta: '15 MINS',
heredoc>         metaBg: 'bg-black/30',
heredoc>         xp: '+50 XP',
heredoc>         btnLabel: 'Start Reading',
heredoc>         gradient: 'from-slate-700 via-blue-900 to-slate-800',
heredoc>         emoji: '🐋',
heredoc>         href: '/child/lesson',
heredoc>         difficulty: 'Easy',
heredoc>         diffColor: 'text-green-300',
heredoc>     },
heredoc>     {
heredoc>         id: 2,
heredoc>         title: 'Number Wizards Challenge',
heredoc>         description: 'Test your skills in addition and subtraction to h
elp the Number Wizards save the day!',
heredoc>         tag: 'MATH',
heredoc>         tagColor: 'bg-emerald-500',
heredoc>         meta: 'LEVEL 2',
heredoc>         metaBg: 'bg-emerald-700/50',
heredoc>         xp: '+75 XP',
heredoc>         btnLabel: 'Solve Now',
heredoc>         gradient: 'from-teal-500 via-emerald-600 to-green-content = r""
"impoi:
heredoc> const quests = [
heredoc>     {
heredoc>         id: 1,
heredoc>          {
heredoc>         i '    um        titleff        description: 'Join Captain Blue
 on an  i        tag: 'READING',
heredoc>         tagColor: 'bg-blue-500',
heredoc>         meta: '15 MINS',
heredoc>         metaBg: 'bg-black/30es        tagColor: 'bg-e         meta: '15
 MINS',
heredoc>     'SCI        metaBg: 'bg-bla:         xp: '+50 XP',
heredoc>        :         btnLabel: 'Sg:        gradient: 'from-slate-700'+     
   emoji: '🐋',
heredoc>         href: '/child/lesson',
heredoc>       ro        href: '/childe-        difficulty: 'Easy',
heredoc>  mo        diffColor: 'text-g'/    },
heredoc>     {
heredoc>         id: 2,
heredoc>        'H    {
heredoc>                titlete        description: 'Test your skills in
heredoc>          tag: 'MATH',
heredoc>      '🔢', color: 'from-emerald-400 to-teal-500', count: 12, href: '/ch
ild/library' },
heredoc>         tagColor: 'g'        meta: 'LEVEL 2',
heredoc>         m-4        metaBg: 'bg-emet:        xp: '+75 XP',
heredoc>         btnLa n        btnLab, emoji:        gradient: 'from-teal-40con
st quests = [
heredoc>     {
heredoc>         id: 1,
heredoc>          {
heredoc>         i '    um        titi:    {
heredoc>         i '    -p         {
heredoc>   se        iun        tagColor: 'bg-blue-500',
heredoc>         meta: '15 MINS',
heredoc>         metaBg: 'bg-black/30es        tagColow        meta: '15 MINS',
heredoc>       '7        metaBg: 'bg-blalo    'SCI        metaBg: 'bg-bla:      
   xp: '+50 XP',
heredoc>        :         btnLaic       :         btnLabel: 'Sg:        gradient
: 'frode        href: '/child/lesson',
heredoc>       ro        href: '/childe-        difficulty: 'Easyoj      ro     
   href: '/child0  mo        diffColor: 'text-g'/    },
heredoc>     {
heredoc>         id: 2 m    {
heredoc>         id: 2,
heredoc>        'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '🔢', color: 'from-emerald-400 to00     '🔢', color:           tag
Color: 'g'        meta: 'LEVEL 2',
heredoc>         m-4        metaBg: 'bg-emet:               m-4        metaBg: '
bg-emet:        :         btnLa n        btnLab, emoji:        gradient: 'a'    
{
heredoc>         id: 1,
heredoc>          {
heredoc>         i '    um        titi:    {
heredoc>         i '    Ho    ge         {
heredoc>   rn        i          i '    -p         {
heredoc>   se  e-  se        iun        tagav        meta: '15 MINS',
heredoc>         metaBg: 'bg-be         metaBg: 'bg-bla0       '7        metaBg:
 'bg-blalo    'SCI        metaBg: 'bg-bla:    sm       :         btnLaic       :
         btnLabel: 'Sg:        gradient: 'frode       e=      ro        href: '/
childe-        difficulty: 'Easyoj      ro        href: '/child0  mo        diff
Coloay    {
heredoc>         id: 2 m    {
heredoc>         id: 2,
heredoc>        'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"         id: 2,
heredoc>  round       'H    6-p:    00    11-cons             z"     '🔢', color
: 'from-emerald-400 t          m-4        metaBg: 'bg-emet:               m-4   
     metaBg: 'bg-emet:        :         btnLa n    ar        id: 1,
heredoc>          {
heredoc>         i '    um        titi:    {
heredoc>         i '    Ho    ge         {
heredoc>   rn        i          i '    -p         {
heredoc>   se  e-  y-40         {
heredoc>   ne        ius        i '    Ho    ge         {
heredoc> ti  rn        i          i '    -p/>  se  e-  se        iun        taga
v               metaBg: 'bg-be         metaBg: 'bg-bla0       '7   ap        id:
 2 m    {
heredoc>         id: 2,
heredoc>        'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"         id: 2,
heredoc>  round       'H    6-p:    00    11-cons             z"     '🔢', color
: 'from-emerald-400 t          m-4        metaBg: 'bg-emet:               m-4   
     metaBg: 'bg-emet:    ,2        id: 2,
heredoc>              'H    v>p:    00       cons             ss     '<ffffffff>
round"         gray-500 hover:te round       'H    6-p:    00 r         {
heredoc>         i '    um        titi:    {
heredoc>         i '    Ho    ge         {
heredoc>   rn        i          i '    -p         {
heredoc>   se  e-  y-40         {
heredoc>   ne        ius        i '    Ho    ge         {
heredoc> ti  rn        i     joi        i d        i '    Ho    ge         {
heredoc> 2   rn        i          i '    -p0-  se  e-  y-40         {
heredoc>   ne        ius 8.  ne        iuc0 .538-.21ti  rn        i          i '
    -p/>  se  e-  sm6        id: 2,
heredoc>        'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"         id: 2,
heredoc>  round       'H    6-p:    00    11-cote       'H      p:    00     utc
ons                    '<ffffffff>round"         id: 2,
heredoc>  round  50 round       'H    6-p:    00g-             'H    v>p:    00 
      cons             ss     '<ffffffff>round"         gray-500 hover:te round 
      'H    6-p:    00 r         {
heredoc>         i '    um        titi:    {
heredoc>         i '    Ho   h         i '    um        titi:    {
heredoc>         i '    Ho    ge         {
heredoc>   rn        i          i '    -p         {
heredoc>   se  e-  y-40         26        i '    Ho    ge         {
heredoc> .5  rn        i          i '    -p1.  se  e-  y-40         {
heredoc>   ne        ius  3  ne        ius        24ti  rn        i     joi     
   i d        i '  0a2   rn        i          i '    -p0-  se  e-  y-40         
{
heredoc>   ne .7  ne        ius 8.  ne        iuc0 .538-.21ti  rn        i 72   
    'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"         id: 2,  p:    00     kecons             
tr     '<ffffffff>round"         id: 2,
heredoc>  round  6  round       'H    6-p:    00   round  50 round       'H    6
-p:    00g-             'H    v>p:    00       cons             ss     '<fffffff
f>round"       -center gap-2.5 hover:opacity-80 transition-opacity">
heredoc>                         <div className="text-right hidden sm:block">
heredoc>                             <p className="text-sm font-bol        i '  
  Ho   h         i ' </        i '    Ho    ge         {
heredoc>   rn        i          t  rn        i          i '    - 2   se  e-  y-4
0         26        i '    </d.5  rn        i          i '    -p1.  se  e-  y-40
       ed  ne        ius  3  ne        ius        24ti  rn        i em  ne .7  n
e        ius 8.  ne        iuc0 .538-.21ti  rn        i 72       'H    {
heredoc> p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>/p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:    00   round  50 ro
und       'H   ndigo-600 to-purple-600 roun                        <div classNam
e="text-right hidden sm:block">
heredoc>                             <p className="text-sm font-bol        i '  
  Ho   h         i ' </        i '    Ho    ge         {
heredoc>   rn        i an                            <p className="text-sm font-
bol        iol  rn        i          t  rn        i          i '    - 2   se  e-
  y-40         26        i '    </d.5  rn        i          rip:    00       'H 

heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>/p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:    00   round  50 ro
und       'H   ndigo-600 to-purple--scons             ">     '<ffffffff>/p:    0
0       'H 
heredoc> cons        cons              =               '<ffffffff>round"      -5
cons            -1                            <p className="text-sm font-bol    
    i '    Ho   h         i ' </        i '    Ho    ge         {
heredoc>   rn        i an                            <p className="text-sm font-
bol        iol  rn        i          t  rn          rn        i an              
              <p className="text-sm font-bol        iol  rn        i          t 
 rn        i      cons              =         tag: 'MATH',
heredoc>      '<ffffffff>/p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:   13     '<ffffffff>
/p:    00       'H 
heredoc> cons        cons              =         f     '<ffffffff>round"      -5
cons            n>cons        cons              =               '<ffffffff>round
"      -5cons            -1                            <p className="text-sm fon
t-bol        i '    Ho   h         i ' </        i '    Ho    ge         {
heredoc>   rn      le  rn        i an                            <p className="t
ext-sm font-bol        iol  rn        i          t  rn          rn        i an  
                          <p className="text-sm font-bol        iol         '<ff
ffffff>/p:    00       'H 
heredoc> cons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:   13     '<ffffffff>
/p:    00       'H 
heredoc> cons        cons              =         f     '<ffffffff>round"      -5
consamcons              =        >1     '<ffffffff>round"      -5cons           
 p cons        cons              =         f     '<ffffffff>round"      -5cons  
          n>cons        cons              =               '<ffffffff>round"     
 -5coe=  rn      le  rn        i an                            <p className="tex
t-sm font-bol        iol  rn        i          t  rn          rn        i an    
                        <p className="text-sm font-bol        iol         '<ffff
ffff>/p:    00       'H 
heredoc> cons              =         tag: 'MATH'/dcons              =         ta
g: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:   13     '<ffffffff>
/p:    00       'H 
heredoc> cons        cons              =         f     '<ffffffff>round"p-2"    
 '<ffffffff>round"      -5cons            owcons        cons              =     
    f     '<ffffffff>round"      -5consamcons              =        >1     '<fff
fffff>round"      -5cons            p cons    ) cons              =         tag:
 'MATH'/dcons              =         tag: 'MATH',
heredoc>      '<ffffffff>round"      -5cons                    '<ffffffff>round"
         id: 2,  p:        round  6  round       'H    6-p:   13     '<ffffffff>
/p:    00       'H 
heredoc> cons        cons              =         f     '<ffffffff>round"p-2"    
 '<ffffffff>round"      -5cons            owcons        cons              =     
    f     '<ffffffff>round"      -5consamcons              =        >1     '<fff
fffff>round"      --center justify-center text-2xl mx-auto mb-2 shadow-sm group-
hover:scale-110 transition     '<ffffffff>round"      -5cons                    
'<ffffffff>round"         id: 2,  p:      cons        cons              =       
  f     '<ffffffff>round"p-2"     '<ffffffff>round"      -5cons            owcon
s        cons              =         f     'sN     '<ffffffff>round"      -5cons
                    '<ffffffff>round"         id: 2,  p:        round  6  round 
      'H    6-p:   13     '<ffffffff>/p:    00       'H 
heredoc> cons        cons              =         f     '<ffffffff>round"p-2"    
 '<ffffffff>round"      -5cons            owcons        cons              =     
    f     '<ffffffff>round"      -5consamcons      d cons        cons           
   =         f     '<ffffffff>round"p-2"     '<ffffffff>round"      -5cons      
      owcons        cons              =         f     '  cons        cons       
       =         f     '<ffffffff>round"p-2"     '<ffffffff>round"      -5cons  
          owcons        cons              =         f     '<ffffffff>round"     
 -5consamcons      d cons        cons              =         f     '<ffffffff>ro
und"p-2"     '<ffffffff>round"      -5cons            owcons        cons        
      =         f     '  cons        cons              =         f     '<fffffff
f>round"p-2"     '<ffffffff>round"      -5cons            owcons        cons    
          =         f     '<ffffffff>round"      -5consamcons      d cons       
 cons              =         f     '<ffffffff>round"p-2"     '<ffffffff>round"  
    -5cons            owcons        cons              =         f     '  cons   
     cons       ay</p>
heredoc>                     </div>
heredoc>                     <Link
heredoc>                         href="/child/lesson"
heredoc>                         className="bg-white text-orange-500 font-extrab
old text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors whitespace
-nowrap shadow-sm flex-shrink-0"
heredoc>                     >
heredoc>                         Play Now 🎯
heredoc>                     </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboard */}
heredoc>                 <div className="grid grid-cols-3 gap-5">
heredoc>                     {/* Quests - takes 2 cols */}
heredoc>                     <div className="col-span-2">
heredoc>                         <div className="flex items-center justify-betwe
en mb-3">
heredoc>                             <h3 className="text-base font-bold text-gra
y-700 flex items-center gap-2">
heredoc>                                 ✨ <span>Your Quests for Today</span>
heredoc>                             </h3>
heredoc>                             <Link href="/child/library" className="text
-xs font-bold text-blue-500 hover:text-blue-600 bg-blue-50 px-3    1            
         <Linkol                                                  className="bg-
white                      >
heredoc>                         Play Now 🎯
heredoc>                     </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboard */}
heredoc>                 <div clas                      cl                    </
Link>
heredoc>         -s          order-gray-100 ove
heredoc>                 {/* ado                <div className="grid grid-c     
                 {/* Quests - takes 2 cols */}
heredoc>      -b                    <div className="col-span-2">}>              
          <div className="flex itg                             <h3 className="te
xt-base font-bold text-gray-700 fl3                                 ✨ <span>You
r Quests for Today</span>
heredoc>                             </                              </h3>
heredoc>                             <Link h                              <Lin  
                        Play Now 🎯
heredoc>                     </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboard */}
heredoc>                 <div clas                      cl                    </
Link>
heredoc>         -s          order-gray-100 ove
heredoc>                              </Link>
heredoc>         ag                </div>
heredoc> 
heredoc>     
heredoc>                 {/* pan                <div clas                       
     -s          order-gray-100 ove
heredoc>                 {/* ado             ${                {/* ado          
           -b                    <div className="col-span-2">}>                 
       <div className="flex itg                                         </      
                        </h3>
heredoc>                             <Link h                              <Lin  
                        Play Now 🎯
heredoc>                     </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests +                               <Link h     
                                              </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboard */}
heredoc>           e=                </div>
heredoc> 
heredoc>     
heredoc>                 {/*              <h4 className="font-bold text-gray-   
     -s          order-gray-100 ove
heredoc>                              </Link>                               </Li
nk>
heredoc> xt        ag                </div>
heredoc> 
heredoc>  -1
heredoc>     
heredoc>                 {/* pan                          {/* ado             ${
                {/* ado                     -b                    <er           
                 <Link h                              <Lin                      
    Play Now 🎯
heredoc>                     </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests +                               <Link h     
                                                 </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests +                                           
             h
heredoc>                 {/*                    </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboard */}
heredoc>           e=                </div>
heredoc> 
heredoc>     
heredoc>              om
heredoc>          to-indigo-500           e=                </div>
heredoc> 
heredoc>     
heredoc>   ns
heredoc>     
heredoc>                 {/*        95"                                  </Link>
                               </Link>
heredoc> xt        ag                </}
heredoc> xt        ag                </div>
heredoc> 
heredoc>  -1
heredoc>     
heredoc>                 {/* pan       
heredoc>  -1
heredoc>     
heredoc>                 {/* pan                                </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests +                               <Link h     
                                                 </Link>
heredoc>                 </div>
heredoc> 
heredoc>                 {/* Quests +                                 </div>
heredoc> 
heredoc>   bo
heredoc>                 {/*                    </div>
heredoc> 
heredoc>                 {/* Quests +                                           
             h
heredoc>                 ="
heredoc>                 {/* tif                {/*                    </div>
heredoc> 
heredoc>                 {/* Quests + Leaderboxt
heredoc>                 {/* Quests + Leaderboard */             e=             
   </div>
heredoc> 
heredoc>     
heredoc>   rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>        
heredoc>     
heredoc>   ns
heredoc>     
heredoc>                 {/*        95"          xt-  ny-    b   raxt        ag 
               </}
heredoc> xt        ag                </div>
heredoc> 
heredoc>  -1
heredoc>     
heredoc>                 {/* pan       
heredoc>   xt        ag                </="
heredoc>  -1
heredoc>     
heredoc>                 {/* pan           { -1
heredoc>     
heredoc>                 {/*                            </div>
heredoc> 
heredoc>                 {/* Quests +           
heredoc>                 {/*                    </div>
heredoc> 
heredoc>                 {/* Questitems-center gap-2 p-2 rounded-xl transition-c
olors ${p.isMe ? 'bg-blue-50 border border-blue-100' : 'h
heredoc>   bo
heredoc>                 {/*                    </div>
heredoc> 
heredoc>                      
heredoc>                 {/* Quests +               xt-                ="
heredoc>                 {/* tif                {/*                    </d?     
            { '
heredoc>                 {/* Quests + Leaderboxt
heredoc>                 {/* Quests.ra                {/* Quests + Leaderboa<fff
fffff><ffffffff>
heredoc>     
heredoc>   rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>        
heredoc>     
heredoc>   ns
heredoc>       rpa                   to            
heredoc>     
heredoc>   ns
heredoc>     
heredoc>    sN    
heredoc>  w-  n-7   un   -fxt        ag                </div>
heredoc> 
heredoc>  -1
heredoc>     
heredoc>                 {/* pan       
heredoc>   xt        k-
heredoc>  -1
heredoc>     
heredoc>                 {/* pan              xt        ag                  -1
heredoc>     
heredoc>                 {/* pan                
heredoc>                 {/*             sN   ="
heredoc>                 {/* Quests +           
heredoc>                               {/*                    l
heredoc>                 {/* Questitems-center gap-2xt-  bo
heredoc>                 {/*                    </div>
heredoc> 
heredoc>                      
heredoc>                 {/* Quests +               xt-       ou   sp
heredoc>                      
heredoc>                 {/* Q                   {/*                   {/* tif  
              {/*                    <y-                {/* Quests + Leaderboxt
heredoc>                 {/* Quests.ra                                  {/* Ques
ts.ra         pa    
heredoc>   rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>        
heredoc>      r                     to            
heredoc>     
heredoc>   ns
heredoc>       rp      
heredoc>      n     }
heredoc>     
heredoc>   ns
heredoc>     
heredoc>    sN    
heredoc>  w-  n-7   un       n             w-  n-7
heredoc>  
heredoc>  -1
heredoc>     
heredoc>                 {/* pan       
heredoc>   xt                    xt        k-
heredoc>  -1
heredoc>     
heredoc>      g-white rounded-2   p   sh    
heredoc>                 {/* pan                
heredoc>                 {/*    ss   e=                {/*             sN   =fl 
               {/* Quests +                                          {/*     em 
               {/* Questitems-center gap-2xt-  bo
heredoc>                     {/*                    </div>
heredoc> 
heredoc>     
heredoc>                      
heredoc>                 {/* Qp((a) => (
heredoc>                                    
heredoc>                 {/* Q                                  {/*             
      {/* Quests.ra                                  {/* Quests.ra         pa   
 
heredoc>   rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>     $  rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>        
heredoc>      r                     t <    c   sN         to   ou       
heredoc>      r            s-     r j    
heredoc>   ns
heredoc>       rp      
heredoc>      n     }
heredoc>   in  n b   er     n     }
heredoc> 10    
heredoc>   ns
heredoc>      n             w-  n-7   
heredoc>  -1
heredoc>     
heredoc>                 {/* pan                     xt                    xt   
   -1
heredoc>     
heredoc>      g-white rounded-2   pme  fl   1 min-w-0">
heredoc>                                           {/*    ss   e=        s      
               {/*                    </div>
heredoc> 
heredoc>     
heredoc>                      
heredoc>                 {/* Qp((a) => (
heredoc>                                    
heredoc>                 {/* Q                                  
heredoc>     
heredoc>                      
heredoc>                 {/*                        d && (
heredoc>                                                 {/* Q             [1  r
b
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>     $  rb
heredoc>     
heredoc>              om
heredoc>          to             h3>
heredoc>        
heredoc>      r                     t <                     to         $  rb
heredoc>     
heredoc>                  
heredoc>                    to            
heredoc>      r                   r       r            s-     r j    
heredoc>   ns
heredoc>       rp      
heredoc>      n       ns
heredoc>       rp      
heredoc>      n                 n     }
heredoc> 
heredoc>    in  n b    10    
heredoc>   ns
heredoc>      n           ns
heredoc> iv      -1
heredoc>     
heredoc>                 {/*v>       }
heredoc>     
heredoc>      g-white rounded-2   pme  fl   1 min-w-0">
heredoc>                        rc   p/                                         
 {/*(c
heredoc>     
heredoc>                      
heredoc>               