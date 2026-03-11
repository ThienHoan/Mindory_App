import Link from 'next/link'

const crewMembers = [
    { name: 'Sammy', initials: 'S', color: 'bg-blue-400' },
    { name: 'Zoe', initials: 'Z', color: 'bg-purple-400' },
    { name: 'Marky', initials: 'M', color: 'bg-green-400' },
]

export default function ChildProfilePage() {
    return (
        <div className="min-h-full bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                    </div>
                    My Explorer Space
                </h1>
                <div className="flex items-center gap-2">
                    <button className="relative p-2 text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="p-6 space-y-5 max-w-3xl mx-auto">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    {/* Avatar */}
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-blue-50 flex items-center justify-center mx-auto">
                            <svg className="w-14 h-14 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                        </div>
                        <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mb-2">Space Explorer Alex</h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-xs font-bold text-orange-500 bg-orange-100 px-3 py-1 rounded-full">LEVEL 15</span>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">JUNIOR CAPTAIN</span>
                    </div>

                    {/* Avatar options */}
                    <div className="flex items-center justify-center gap-2">
                        {['bg-blue-300', 'bg-gray-400', 'bg-purple-300', 'bg-yellow-400'].map((color, i) => (
                            <button key={i} className={`w-10 h-10 rounded-full ${color} border-2 border-white shadow-sm`} />
                        ))}
                        <button className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Total Stars</p>
                        <p className="text-2xl font-extrabold text-gray-800">1,250</p>
                        <div className="mt-2 h-1.5 bg-orange-100 rounded-full">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: '83%' }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Next reward at 1,500</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Badges Earned</p>
                        <p className="text-2xl font-extrabold text-gray-800">24</p>
                        <div className="mt-2 h-1.5 bg-purple-100 rounded-full">
                            <div className="h-full bg-purple-400 rounded-full" style={{ width: '60%' }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">4 more for new rank</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Day Streak</p>
                        <p className="text-2xl font-extrabold text-gray-800">12</p>
                        <div className="mt-2 h-1.5 bg-green-100 rounded-full">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: '48%' }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Keep it up, Champ!</p>
                    </div>
                </div>

                {/* Bottom row: Crew + Mission */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Crew Members */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Crew Members</h3>
                            <button className="text-sm font-semibold text-blue-500 hover:text-blue-600">View All</button>
                        </div>
                        <div className="flex items-center gap-3">
                            {crewMembers.map((m) => (
                                <div key={m.name} className="flex flex-col items-center gap-1">
                                    <div className={`w-12 h-12 rounded-full ${m.color} flex items-center justify-center text-white font-bold text-sm`}>
                                        {m.initials}
                                    </div>
                                    <span className="text-xs text-gray-500">{m.name}</span>
                                </div>
                            ))}
                            <div className="flex flex-col items-center gap-1">
                                <button className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <span className="text-xs text-gray-500">Add</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Mission */}
                    <div className="bg-blue-500 rounded-2xl p-5 shadow-sm text-white">
                        <p className="text-xs font-bold text-blue-200 tracking-widest mb-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                            PLANET MATH
                        </p>
                        <h3 className="text-lg font-extrabold mb-1">Mastering Multi-Digits</h3>
                        <p className="text-sm text-blue-200 mb-4">4 of 10 tasks completed</p>
                        <div className="h-2 bg-blue-400 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: '40%' }} />
                        </div>
                        <Link
                            href="/child/lesson"
                            className="block text-center bg-white text-blue-500 font-bold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            Continue Mission
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
