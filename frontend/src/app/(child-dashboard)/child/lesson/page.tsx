'use client'

import { useState } from 'react'
import Link from 'next/link'

const shapes = [
    { id: 1, type: 'circle', color: 'bg-blue-300', isStar: false },
    { id: 2, type: 'square', color: 'bg-green-500', isStar: false },
    { id: 3, type: 'star', color: 'bg-yellow-300', isStar: true },
    { id: 4, type: 'diamond', color: 'bg-red-300', isStar: false },
]

export default function ChildLessonPage() {
    const [found, setFound] = useState(false)
    const [showReward, setShowReward] = useState(false)

    const handleShapeClick = (isStar: boolean) => {
        if (isStar) {
            setFound(true)
            setShowReward(true)
            setTimeout(() => setShowReward(false), 3000)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 text-blue-500">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 leading-none">The Hidden Star Puzzle</p>
                            <p className="text-xs text-blue-500 font-semibold">LEVEL 2: LOGIC & SHAPES</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 flex-1 max-w-xs mx-8">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Page 4 of 6</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <span className="text-xs font-bold text-blue-500 whitespace-nowrap">65% Done!</span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-blue-700">12:45</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm">
                        A
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                <div className="bg-white rounded-3xl shadow-sm w-full max-w-2xl p-10">
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
                        Can you find the hidden star?
                    </h2>
                    <p className="text-sm text-gray-400 text-center mb-8">
                        Look closely at the patterns and click when you see it!
                    </p>

                    {/* Shapes area */}
                    <div className="relative border-2 border-dashed border-blue-200 rounded-2xl bg-gray-50 p-10 flex items-center justify-center gap-10 mb-8">
                        {/* Found counter */}
                        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Found: {found ? '1' : '0'}/1
                        </div>

                        {shapes.map((shape) => (
                            <button
                                key={shape.id}
                                onClick={() => handleShapeClick(shape.isStar)}
                                className="transition-transform hover:scale-110 active:scale-95"
                            >
                                {shape.type === 'circle' && (
                                    <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center" />
                                )}
                                {shape.type === 'square' && (
                                    <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center" />
                                )}
                                {shape.type === 'star' && (
                                    <div className={`w-16 h-16 rounded-full ${found ? 'bg-yellow-300' : 'bg-yellow-200'} flex items-center justify-center text-3xl transition-colors`}>
                                        ⭐
                                    </div>
                                )}
                                {shape.type === 'diamond' && (
                                    <div className="w-16 h-16 bg-red-300 rounded-sm flex items-center justify-center transform rotate-45" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Audio bar */}
                    <div className="bg-gray-100 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div className="flex-1 h-1.5 bg-gray-300 rounded-full">
                            <div className="h-full bg-gray-400 rounded-full" style={{ width: '40%' }} />
                        </div>
                        <span className="text-xs text-gray-400">Narrator Au...</span>
                    </div>
                </div>
            </main>

            {/* Bottom nav */}
            <footer className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between max-w-2xl mx-auto w-full">
                <Link
                    href="/child"
                    className="flex items-center gap-2 px-5 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Link>
                <button className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-semibold transition-colors">
                    Next Lesson
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <button className="flex items-center gap-2 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full text-sm font-semibold transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Finish
                </button>
            </footer>

            {/* Reward popup */}
            {showReward && (
                <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-xl p-4 w-48 border border-gray-100 animate-bounce">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            🏆
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Earned Today</p>
                            <p className="text-base font-extrabold text-gray-800">120 Stars</p>
                        </div>
                    </div>
                    <p className="text-xs text-center text-blue-500 font-semibold">KEEP IT UP!</p>
                </div>
            )}
        </div>
    )
}
