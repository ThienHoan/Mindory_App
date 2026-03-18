'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api, Lesson, Quiz, Subject, Task } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type TaskItem = Task

const ACTIVE_SESSION_PREFIX = 'mindory:active-session:'

function getSessionKey(taskId: string) {
    return `${ACTIVE_SESSION_PREFIX}${taskId}`
}

function formatTime(seconds: number) {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function ResultScreen({
    score,
    total,
    rewardType,
    rewardMinutes,
    onHome,
    onRetry,
}: {
    score: number
    total: number
    rewardType?: 'game' | 'music' | null
    rewardMinutes?: number
    onHome: () => void
    onRetry: () => void
}) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const isPerfect = pct === 100
    const isGood = pct >= 70

    return (
        <div className="min-h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-8 flex flex-col items-center gap-6 text-center">
                <div
                    className={cn(
                        'w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg',
                        isPerfect ? 'bg-yellow-400 shadow-yellow-200' : isGood ? 'bg-purple-500 shadow-purple-200' : 'bg-gray-200 shadow-gray-200'
                    )}
                >
                    {isPerfect ? '🏆' : isGood ? '⭐' : '💪'}
                </div>

                <div>
                    <h1 className="text-3xl font-black text-gray-800">{isPerfect ? 'Hoàn hảo!' : isGood ? 'Xuất sắc!' : 'Cố lên nhé!'}</h1>
                    <p className="text-gray-500 font-medium mt-1">Bé trả lời đúng {score}/{total} câu.</p>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            isPerfect ? 'bg-yellow-400' : isGood ? 'bg-purple-500' : 'bg-gray-400'
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="text-2xl font-black text-gray-800 -mt-3">{pct}%</p>

                {rewardType && (
                    <div
                        className={cn(
                            'w-full rounded-2xl border-2 p-4 flex items-center gap-4 text-left',
                            rewardType === 'game' ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-200'
                        )}
                    >
                        <span className="text-3xl shrink-0">{rewardType === 'game' ? '🎮' : '🎵'}</span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Phần thưởng</p>
                            <p className="text-base font-black text-gray-800 mt-0.5">{rewardMinutes} phút {rewardType === 'game' ? 'chơi game' : 'nghe nhạc'}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onHome}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-sm"
                    >
                        Về trang chủ
                    </button>
                    <button
                        onClick={onRetry}
                        className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl text-sm"
                    >
                        Làm lại
                    </button>
                </div>
            </div>
        </div>
    )
}

function QuizContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const subjectIdFilter = searchParams.get('subjectId')
    const taskId = searchParams.get('taskId')
    const lessonId = searchParams.get('lessonId')
    const lessonTitle = searchParams.get('lessonTitle') || 'Kiểm tra bài học'
    const requestedDuration = Number(searchParams.get('duration') || 10)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [grade, setGrade] = useState<number>(4)
    const [childId, setChildId] = useState<string | null>(null)

    const [subjects, setSubjects] = useState<Subject[]>([])
    const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({})
    const [tasks, setTasks] = useState<TaskItem[]>([])

    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [timerSeconds, setTimerSeconds] = useState(Math.max(60, requestedDuration * 60))

    const [currentQ, setCurrentQ] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [confirmed, setConfirmed] = useState(false)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [finished, setFinished] = useState(false)
    const [rewardType, setRewardType] = useState<'game' | 'music' | null>(null)
    const [rewardMinutes, setRewardMinutes] = useState(0)

    const handleFinish = useCallback(async () => {
        setFinished(true)

        if (taskId && sessionId && childId) {
            setSubmitting(true)
            try {
                const finalScore = quizzes.reduce((sum, q, idx) => (answers[idx] === q.correct_index ? sum + 1 : sum), 0)
                const result = await api.sessions.finish(sessionId, {
                    childId,
                    quizScore: finalScore,
                    quizTotal: quizzes.length,
                })

                try {
                    window.localStorage.removeItem(getSessionKey(taskId))
                } catch {
                    // ignore localStorage failure
                }

                if (result?.reward) {
                    setRewardType(result.reward.reward_type)
                    setRewardMinutes(Math.round((result.reward.duration_seconds ?? 0) / 60))
                }
            } catch {
                // keep result screen visible even if save fails
            } finally {
                setSubmitting(false)
            }
        }
    }, [answers, childId, quizzes, sessionId, taskId])

    useEffect(() => {
        async function load() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    setError('Bạn chưa đăng nhập.')
                    return
                }

                setChildId(user.id)

                if (!lessonId) {
                    const [{ data: profile }, taskRes] = await Promise.all([
                        supabase.from('profiles').select('*').eq('id', user.id).single(),
                        api.tasks.listForChild(user.id),
                    ])

                    const nextGrade = profile?.grade || 4
                    setGrade(nextGrade)

                    const trueSubjectRes = await api.subjects.listByGrade(nextGrade)
                    const subjectList: Subject[] = trueSubjectRes?.data ?? []
                    setSubjects(subjectList)
                    setTasks((taskRes?.data ?? taskRes ?? []) as TaskItem[])

                    const lessonResults = await Promise.all(
                        subjectList.map(async (subject) => {
                            const lessonRes = await api.lessons.listBySubject(subject.id)
                            return [subject.id, lessonRes?.data ?? []] as const
                        })
                    )

                    const nextLessons: Record<string, Lesson[]> = {}
                    for (const [subjectId, list] of lessonResults) {
                        nextLessons[subjectId] = list
                    }
                    setLessonsBySubject(nextLessons)
                    return
                }

                const quizData = await api.quizzes.listByLesson(lessonId)
                if (!Array.isArray(quizData) || quizData.length === 0) {
                    setError('Bài học này chưa có câu hỏi.')
                    return
                }

                setQuizzes(quizData)
                setAnswers(new Array(quizData.length).fill(null))

                if (taskId) {
                    const task = await api.tasks.get(taskId)
                    const duration = Number(task?.session_duration_minutes) || requestedDuration
                    setTimerSeconds(Math.max(60, duration * 60))

                    if (task?.status !== 'completed') {
                        let activeSessionId: string | null = null
                        const key = getSessionKey(taskId)

                        try {
                            activeSessionId = window.localStorage.getItem(key)
                        } catch {
                            activeSessionId = null
                        }

                        if (!activeSessionId) {
                            const session = await api.sessions.start(taskId, user.id)
                            activeSessionId = session?.id ?? null
                            if (activeSessionId) {
                                try {
                                    window.localStorage.setItem(key, activeSessionId)
                                } catch {
                                    // ignore localStorage failure
                                }
                            }
                        }

                        setSessionId(activeSessionId)
                    }
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Không thể tải trang kiểm tra.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [lessonId, requestedDuration, supabase, taskId])

    useEffect(() => {
        if (!lessonId || loading || finished) return
        const timer = window.setInterval(() => {
            setTimerSeconds((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [finished, lessonId, loading])

    useEffect(() => {
        if (lessonId && timerSeconds === 0 && !finished && !loading) {
            void handleFinish()
        }
    }, [finished, handleFinish, lessonId, loading, timerSeconds])

    const filteredSubjects = useMemo(() => {
        if (!subjectIdFilter) return subjects
        return subjects.filter((subject) => subject.id === subjectIdFilter)
    }, [subjectIdFilter, subjects])

    const quiz = quizzes[currentQ] || null
    const score = quizzes.reduce((sum, q, idx) => (answers[idx] === q.correct_index ? sum + 1 : sum), 0)
    const answeredCount = answers.filter((a) => a !== null).length
    const progressPct = quizzes.length > 0 ? Math.round((answeredCount / quizzes.length) * 100) : 0
    const isCorrect = selected !== null && quiz ? selected === quiz.correct_index : false

    const handleConfirm = () => {
        if (selected === null || !quiz) return
        const nextAnswers = [...answers]
        nextAnswers[currentQ] = selected
        setAnswers(nextAnswers)
        setConfirmed(true)
    }

    const handleNext = () => {
        if (currentQ + 1 >= quizzes.length) {
            void handleFinish()
            return
        }
        setCurrentQ((q) => q + 1)
        setSelected(null)
        setConfirmed(false)
    }

    const handleSkip = () => {
        if (currentQ + 1 >= quizzes.length) {
            void handleFinish()
            return
        }
        setCurrentQ((q) => q + 1)
        setSelected(null)
        setConfirmed(false)
    }

    const handleRetry = () => {
        setCurrentQ(0)
        setSelected(null)
        setConfirmed(false)
        setAnswers(new Array(quizzes.length).fill(null))
        setFinished(false)
        setRewardType(null)
        setRewardMinutes(0)
    }

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-purple-400">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8">
                <span className="text-5xl">😕</span>
                <p className="text-gray-500 font-bold text-center">{error}</p>
                <Link href="/child/quiz" className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-sm">
                    Về trang kiểm tra
                </Link>
            </div>
        )
    }

    if (!lessonId) {
        const activeTasks = tasks.filter((task) => task.status !== 'completed')

        return (
            <div className="max-w-6xl mx-auto p-8 space-y-7">
                <div className="rounded-[2rem] bg-gradient-to-r from-slate-900 to-indigo-900 p-7 text-white">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Kiểm tra</p>
                    <h1 className="text-3xl font-black mt-2">Learning Map tích hợp kiểm tra</h1>
                    <p className="text-indigo-200 mt-2">Chọn môn, chọn bài và bắt đầu trắc nghiệm với Pomodoro.</p>
                </div>

                {activeTasks.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">Bài kiểm tra từ nhiệm vụ</h2>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{activeTasks.length} bài</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {activeTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Task Quiz</p>
                                    <h3 className="text-lg font-black text-gray-800 mt-1 line-clamp-1">{task.lessons?.title ?? 'Bài học'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.lessons?.description ?? 'Làm bài kiểm tra để hoàn thành nhiệm vụ.'}</p>
                                    <p className="mt-3 text-xs font-bold text-gray-500">Pomodoro: {task.session_duration_minutes} phút</p>
                                    <Link
                                        href={`/child/quiz?taskId=${task.id}&lessonId=${task.lesson_id}&lessonTitle=${encodeURIComponent(task.lessons?.title ?? 'Bài học')}&duration=${task.session_duration_minutes}`}
                                        className="mt-3 inline-flex justify-center w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black"
                                    >
                                        Làm kiểm tra ngay
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <h2 className="text-xl font-black text-gray-800">Môn học lớp {grade}</h2>
                    {filteredSubjects.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-500 font-semibold">Không có môn học để kiểm tra.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredSubjects.map((subject) => {
                                const lessons = lessonsBySubject[subject.id] ?? []
                                return (
                                    <div key={subject.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-800">{subject.name}</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lessons.length} chương / bài</p>
                                            </div>
                                            <Link href={`/child/lesson`} className="text-xs font-black text-purple-600 hover:underline">
                                                Xem tài liệu học
                                            </Link>
                                        </div>
                                        {lessons.length === 0 ? (
                                            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400 font-semibold text-center">Chưa có bài học.</div>
                                        ) : (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {lessons.map((lesson, idx) => (
                                                    <div key={lesson.id} className="rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60">
                                                        <p className="text-sm font-black text-gray-700">Chương {idx + 1}: {lesson.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Link
                                                                href={`/child/lesson?id=${lesson.id}`}
                                                                className="flex-1 py-2 text-center rounded-xl border border-gray-200 text-gray-600 text-xs font-black hover:bg-white"
                                                            >
                                                                Ôn bài
                                                            </Link>
                                                            <Link
                                                                href={`/child/quiz?lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`}
                                                                className="flex-1 py-2 text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
                                                            >
                                                                Trắc nghiệm
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>
        )
    }

    if (finished && submitting) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-500">Đang lưu kết quả...</p>
                </div>
            </div>
        )
    }

    if (finished) {
        return (
            <ResultScreen
                score={score}
                total={quizzes.length}
                rewardType={rewardType}
                rewardMinutes={rewardMinutes}
                onHome={() => router.push('/child')}
                onRetry={handleRetry}
            />
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href={taskId ? `/child/lesson?taskId=${taskId}` : '/child/quiz'}
                    className="p-2 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">Quiz Challenge</p>
                    <h1 className="text-base font-black text-gray-800 truncate">{lessonTitle}</h1>
                </div>
                <div className="shrink-0 text-right">
                    <span className="text-xs font-black text-gray-400">{currentQ + 1}/{quizzes.length}</span>
                </div>
            </div>

            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5">
                        <p className="text-purple-200 text-xs font-black uppercase tracking-widest mb-2">Question {currentQ + 1} of {quizzes.length}</p>
                        <h2 className="text-white font-black text-xl leading-snug">{quiz?.question}</h2>
                        <p className="text-purple-200 text-sm mt-2">Chọn đáp án đúng nhất</p>
                    </div>

                    <div className="p-5 space-y-3">
                        {quiz?.options.map((option, idx) => {
                            const letter = String.fromCharCode(65 + idx)
                            let containerStyle = 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                            let letterStyle = 'bg-gray-100 text-gray-500'

                            if (selected === idx && !confirmed) {
                                containerStyle = 'border-purple-500 bg-purple-50'
                                letterStyle = 'bg-purple-600 text-white'
                            }
                            if (confirmed && quiz) {
                                if (idx === quiz.correct_index) {
                                    containerStyle = 'border-green-400 bg-green-50 cursor-default'
                                    letterStyle = 'bg-green-500 text-white'
                                } else if (selected === idx) {
                                    containerStyle = 'border-red-400 bg-red-50 cursor-default'
                                    letterStyle = 'bg-red-500 text-white'
                                } else {
                                    containerStyle = 'border-gray-100 bg-gray-50 opacity-50 cursor-default'
                                    letterStyle = 'bg-gray-200 text-gray-400'
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={confirmed}
                                    onClick={() => setSelected(idx)}
                                    className={cn('w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left', containerStyle)}
                                >
                                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0', letterStyle)}>{letter}</div>
                                    <span className="text-sm font-bold text-gray-700 flex-1">{option}</span>
                                </button>
                            )
                        })}
                    </div>

                    {confirmed && (
                        <div className={cn('mx-5 mb-5 px-4 py-3 rounded-2xl', isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
                            <p className={cn('text-sm font-black', isCorrect ? 'text-green-700' : 'text-red-700')}>
                                {isCorrect ? 'Chính xác! Bé giỏi lắm!' : `Chưa đúng, đáp án đúng là: ${quiz?.options[quiz.correct_index]}`}
                            </p>
                        </div>
                    )}

                    <div className="px-5 pb-5 flex items-center gap-3">
                        {!confirmed ? (
                            <>
                                <button onClick={handleSkip} className="w-1/3 py-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-black text-sm">
                                    Bỏ qua
                                </button>
                                <button
                                    disabled={selected === null}
                                    onClick={handleConfirm}
                                    className={cn(
                                        'w-2/3 py-4 rounded-2xl font-black text-sm',
                                        selected !== null ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    )}
                                >
                                    Xác nhận
                                </button>
                            </>
                        ) : (
                            <button onClick={handleNext} className="w-full py-4 rounded-2xl font-black text-sm bg-purple-600 hover:bg-purple-700 text-white">
                                {currentQ + 1 >= quizzes.length ? 'Xem kết quả' : 'Câu tiếp theo'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pomodoro</p>
                        <p className={cn('text-5xl font-black mt-2 tabular-nums', timerSeconds <= 60 ? 'text-red-500' : 'text-slate-800')}>
                            {formatTime(timerSeconds)}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Hết giờ sẽ tự nộp bài</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-violet-500 rounded-3xl p-5 text-white">
                        <p className="text-xs font-black uppercase tracking-widest text-purple-200">Tiến độ</p>
                        <p className="text-sm font-bold mt-2">Đúng: {score} / {quizzes.length}</p>
                        <p className="text-sm font-bold">Đã trả lời: {answeredCount} câu</p>
                    </div>

                    <button onClick={handleSkip} className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-sm">
                        Skip Question
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ChildQuizPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <QuizContent />
        </Suspense>
    )
}