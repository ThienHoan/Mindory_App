'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Trophy, Star, ArrowRight, Home, RefreshCcw } from 'lucide-react'

export default function ChildPDFQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [document, setDocument] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [isAnswered, setIsAnswered] = useState(false)
    const [score, setScore] = useState(0)
    const [isFinished, setIsFinished] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const playable = await api.aiQuizzes.getPlayable(id)
            setDocument(playable.document)
            setQuestions(playable.questions)
        } catch (error) {
            console.error('Failed to load:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOption = (index: number) => {
        if (isAnswered) return
        setSelectedAnswer(index)
    }

    const handleCheckAnswer = () => {
        if (selectedAnswer === null) return
        
        setIsAnswered(true)
        if (selectedAnswer === questions[currentIndex].correct_index) {
            setScore(prev => prev + 1)
        }
    }

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setIsAnswered(false)
        } else {
            setIsFinished(true)
        }
    }

    const handleRestart = () => {
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setScore(0)
        setIsFinished(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-sky-50 flex items-center justify-center">
                <div className="animate-bounce">
                    <Star className="w-16 h-16 text-yellow-400 fill-yellow-400" />
                </div>
            </div>
        )
    }

    if (!document || questions.length === 0) {
        return (
            <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">á»i! ChÆ°a cÃ³ cÃ¢u há»i nÃ o</h2>
                    <p className="text-slate-600 mb-8">Bá»‘ máº¹ chÆ°a duyá»‡t xong cÃ¢u há»i cho bÃ i nÃ y. BÃ© quay láº¡i sau nhÃ©!</p>
                    <Link href="/child" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 inline-block">
                        Vá» Trang Chá»§
                    </Link>
                </div>
            </div>
        )
    }

    if (isFinished) {
        const percentage = (score / questions.length) * 100
        let message = 'Cá»‘ gáº¯ng lÃªn nhÃ©!'
        if (percentage === 100) message = 'Tuyá»‡t vá»i quÃ¡!'
        else if (percentage >= 80) message = 'Ráº¥t giá»i!'
        else if (percentage >= 50) message = 'KhÃ¡ láº¯m!'

        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-amber-400 -z-0"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                            <Trophy className="w-12 h-12 text-yellow-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">{message}</h2>
                        <p className="text-slate-600 font-medium mb-8">BÃ© Ä‘Ã£ hoÃ n thÃ nh bÃ i: {document.title}</p>
                        
                        <div className="text-6xl font-black text-indigo-600 mb-2">
                            {score}<span className="text-3xl text-slate-400">/{questions.length}</span>
                        </div>
                        <p className="text-slate-500 font-medium mb-8">CÃ¢u tráº£ lá»i Ä‘Ãºng</p>

                        <div className="flex gap-4 w-full">
                            <button onClick={handleRestart} className="flex-1 bg-amber-100 text-amber-700 py-4 rounded-2xl font-bold text-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2">
                                <RefreshCcw className="w-5 h-5" /> ChÆ¡i Láº¡i
                            </button>
                            <Link href="/child" className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                                <Home className="w-5 h-5" /> Xong
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]

    return (
        <div className="min-h-screen bg-sky-50 flex flex-col p-4 md:p-8 font-sans">
            <div className="max-w-3xl w-full mx-auto flex-grow flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm">
                    <Link href="/child" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <Home className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-slate-700 text-lg">Äiá»ƒm: {score}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold text-slate-500 mb-2 px-2">
                        <span>CÃ¢u {currentIndex + 1} / {questions.length}</span>
                        <span>{( (currentIndex / questions.length) * 100 ).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-4 overflow-hidden border-2 border-white shadow-inner">
                        <div 
                            className="bg-sky-400 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="bg-white rounded-3xl shadow-md p-6 md:p-10 mb-6 flex-grow flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 leading-snug">
                        {currentQuestion.question}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                        {currentQuestion.options.map((option: string, index: number) => {
                            let stateClass = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                            let badgeClass = "bg-white text-slate-500 border border-slate-200"

                            if (isAnswered) {
                                if (index === currentQuestion.correct_index) {
                                    stateClass = "bg-green-100 border-green-400 text-green-800"
                                    badgeClass = "bg-green-500 text-white border-transparent"
                                } else if (index === selectedAnswer) {
                                    stateClass = "bg-red-100 border-red-400 text-red-800"
                                    badgeClass = "bg-red-500 text-white border-transparent"
                                } else {
                                    stateClass = "bg-slate-50 border-slate-200 opacity-50"
                                }
                            } else if (selectedAnswer === index) {
                                stateClass = "bg-sky-100 border-sky-400 text-sky-800 shadow-md transform scale-[1.02] transition-transform"
                                badgeClass = "bg-sky-500 text-white border-transparent"
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelectOption(index)}
                                    disabled={isAnswered}
                                    className={`relative p-5 rounded-2xl border-2 font-bold text-lg text-left transition-all flex items-center gap-4 ${stateClass}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0 transition-colors ${badgeClass}`}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span>{option}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end h-16">
                    {selectedAnswer !== null && !isAnswered && (
                        <button 
                            onClick={handleCheckAnswer}
                            className="bg-amber-400 hover:bg-amber-500 text-amber-900 px-8 py-4 rounded-2xl font-black text-xl shadow-[0_4px_0_#d97706] active:shadow-[0_0px_0_#d97706] active:translate-y-1 transition-all"
                        >
                            Kiá»ƒm tra
                        </button>
                    )}
                    
                    {isAnswered && (
                        <button 
                            onClick={handleNext}
                            className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_4px_0_#0284c7] active:shadow-[0_0px_0_#0284c7] active:translate-y-1 transition-all flex items-center gap-2"
                        >
                            {currentIndex < questions.length - 1 ? 'CÃ¢u tiáº¿p theo' : 'HoÃ n thÃ nh'}
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}


