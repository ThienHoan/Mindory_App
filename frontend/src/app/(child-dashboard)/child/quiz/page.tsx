'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AIAssignment, api, Lesson, Quiz, Subject, Task } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { DEFAULT_FREE_QUIZ_SECONDS, SessionPolicy, buildSessionPolicy } from '@/lib/learning/session-policy'
import { clearLearningSessionProgress, loadLearningSessionProgress, saveLearningSessionProgress } from '@/lib/learning/session-storage'

type TaskItem = Task

const CORE_SUBJECT_KEYS = ['toan', 'tieng viet', 'tieng anh']
const COMPLETION_XP = 10

function normalizeSubjectName(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

function isCoreSubject(name: string) {
    const normalized = normalizeSubjectName(name)
    return CORE_SUBJECT_KEYS.some((key) => normalized.includes(key))
}

const ACTIVE_SESSION_PREFIX = 'mindory:active-session:'

type PomodoroPhase = 'quiz' | 'choice' | 'game' | 'break'

const RANDOM_GAME_VIEWS = ['memory', 'maze', 'music'] as const

function getSessionKey(taskId: string) {
    return `${ACTIVE_SESSION_PREFIX}${taskId}`
}

function formatTime(seconds: number) {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function pickRandomGameView() {
    return RANDOM_GAME_VIEWS[Math.floor(Math.random() * RANDOM_GAME_VIEWS.length)]
}

function ResultScreen({
    score,
    total,
    rewardType,
    rewardMinutes,
    xpAwarded,
    onRetry,
}: {
    score: number
    total: number
    rewardType?: 'game' | 'music' | null
    rewardMinutes?: number
    xpAwarded?: number
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

                {(xpAwarded ?? 0) > 0 && (
                    <div className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">XP vừa nhận</p>
                        <p className="mt-1 text-3xl font-black text-emerald-700">+{xpAwarded} XP</p>
                    </div>
                )}

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

                <div className="w-full space-y-4">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onRetry}
                            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-sm"
                        >
                            Làm lại phiên này
                        </button>
                        <Link href="/child" className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl text-sm text-center">
                            Về trang chủ
                        </Link>
                    </div>
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
    const aiAssignmentId = searchParams.get('aiAssignmentId')
    const aiDocumentId = searchParams.get('aiDocumentId') || searchParams.get('documentId')
    const lessonTitle = searchParams.get('lessonTitle') || 'Kiểm tra bài học'
    const rawDurationMinutes = Number(searchParams.get('duration'))
    const durationQueryMinutes = Number.isFinite(rawDurationMinutes) && rawDurationMinutes > 0 ? rawDurationMinutes : null
    const defaultPolicy = useMemo<SessionPolicy>(() => buildSessionPolicy({ mode: 'free-quiz' }), [])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [grade, setGrade] = useState<number>(1)
    const [childId, setChildId] = useState<string | null>(null)

    const [subjects, setSubjects] = useState<Subject[]>([])
    const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({})
    const [tasks, setTasks] = useState<TaskItem[]>([])
    const [aiAssignments, setAiAssignments] = useState<AIAssignment[]>([])

    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>(defaultPolicy)
    const [sessionTotalSeconds, setSessionTotalSeconds] = useState(DEFAULT_FREE_QUIZ_SECONDS)
    const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(DEFAULT_FREE_QUIZ_SECONDS)
    const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(defaultPolicy.focusIntervalSeconds)
    const [focusBreakPending, setFocusBreakPending] = useState(false)
    const [phase, setPhase] = useState<PomodoroPhase>('quiz')
    const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(0)
    const [cycleCount, setCycleCount] = useState(1)
    const [gameView, setGameView] = useState<(typeof RANDOM_GAME_VIEWS)[number]>(() => pickRandomGameView())
    const [gameSeed, setGameSeed] = useState(() => Date.now())

    const [currentQ, setCurrentQ] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [confirmed, setConfirmed] = useState(false)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [finished, setFinished] = useState(false)
    const [rewardType, setRewardType] = useState<'game' | 'music' | null>(null)
    const [rewardMinutes, setRewardMinutes] = useState(0)
    const [xpAwarded, setXpAwarded] = useState(0)
    const [studyActiveSeconds, setStudyActiveSeconds] = useState(0)
    const [studyIdleSeconds, setStudyIdleSeconds] = useState(0)
    const [quizElapsedSeconds, setQuizElapsedSeconds] = useState(0)
    const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0)
    const [gameBreakElapsedSeconds, setGameBreakElapsedSeconds] = useState(0)

    const handleFinish = useCallback(async () => {
        setFinished(true)

        if (aiAssignmentId && childId) {
            setSubmitting(true)
            try {
                const result = await api.aiAssignments.markComplete(aiAssignmentId)
                setXpAwarded(result.xpAwarded ?? 0)
            } catch {
                // keep result screen visible even if save fails
            } finally {
                setSubmitting(false)
            }
            return
        }

        if (taskId && sessionId && childId) {
            setSubmitting(true)
            try {
                const finalScore = quizzes.reduce((sum, q, idx) => (answers[idx] === q.correct_index ? sum + 1 : sum), 0)
                const result = await api.sessions.finish(sessionId, {
                    childId,
                    quizScore: finalScore,
                    quizTotal: quizzes.length,
                    activeSeconds: studyActiveSeconds + quizElapsedSeconds,
                    idleSeconds: studyIdleSeconds,
                    studySeconds: studyActiveSeconds,
                    quizSeconds: quizElapsedSeconds,
                    breakSeconds: breakElapsedSeconds,
                    gameBreakSeconds: gameBreakElapsedSeconds,
                })

                try {
                    window.localStorage.removeItem(getSessionKey(taskId))
                } catch {
                    // ignore localStorage failure
                }
                clearLearningSessionProgress(taskId)

                if (result?.reward) {
                    setRewardType(result.reward.reward_type)
                    setRewardMinutes(Math.round((result.reward.duration_seconds ?? 0) / 60))
                }
                setXpAwarded(result.xpAwarded ?? 0)
            } catch {
                // keep result screen visible even if save fails
            } finally {
                setSubmitting(false)
            }
        }
    }, [aiAssignmentId, answers, breakElapsedSeconds, childId, gameBreakElapsedSeconds, quizzes, quizElapsedSeconds, sessionId, studyActiveSeconds, studyIdleSeconds, taskId])

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

                if (!lessonId && !aiDocumentId) {
                    const [{ data: profile }, taskRes, aiRes] = await Promise.all([
                        supabase.from('profiles').select('*').eq('id', user.id).single(),
                        api.tasks.listForChild(user.id),
                        api.aiAssignments.listMine(),
                    ])

                    if (profile?.grade === null || profile?.grade === undefined) {
                        setError('Bé chưa được gán lớp. Vui lòng nhờ phụ huynh cập nhật hồ sơ.')
                        return
                    }

                    const nextGrade = profile.grade
                    setGrade(nextGrade)

                    const trueSubjectRes = await api.subjects.listByGrade(nextGrade)
                    const subjectList: Subject[] = (trueSubjectRes?.data ?? []).filter((subject) => isCoreSubject(subject.name))
                    setSubjects(subjectList)
                    setTasks((taskRes?.data ?? taskRes ?? []) as TaskItem[])
                    setAiAssignments((aiRes ?? []) as AIAssignment[])

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

                if (aiDocumentId) {
                    const playable = await api.aiQuizzes.getPlayable(aiDocumentId)
                    const quizData = playable.questions
                    if (!Array.isArray(quizData) || quizData.length === 0) {
                        setError('Bài AI này chưa có câu hỏi.')
                        return
                    }

                    setQuizzes(quizData as Quiz[])
                    setAnswers(new Array(quizData.length).fill(null))
                } else {
                    if (!lessonId) {
                        setError('Thiếu bài học để mở kiểm tra.')
                        return
                    }
                    const quizData = await api.quizzes.listByLesson(lessonId)
                    if (!Array.isArray(quizData) || quizData.length === 0) {
                        setError('Bài học này chưa có câu hỏi.')
                        return
                    }

                    setQuizzes(quizData)
                    setAnswers(new Array(quizData.length).fill(null))
                }

                const task = taskId ? await api.tasks.get(taskId) : null
                const nextPolicy = buildSessionPolicy({
                    durationMinutes: task?.session_duration_minutes ?? durationQueryMinutes,
                    assigned: Boolean(taskId || aiAssignmentId),
                    mode: taskId || aiAssignmentId ? 'assigned-quiz' : 'free-quiz',
                })
                const sharedProgress = taskId ? loadLearningSessionProgress(taskId) : null
                const sharedActiveSeconds = sharedProgress?.activeSeconds ?? 0

                if (taskId && task?.status !== 'completed' && sharedActiveSeconds < nextPolicy.minActiveBeforeQuizSeconds) {
                    router.replace(`/child/lesson/study?taskId=${encodeURIComponent(taskId)}`)
                    return
                }

                setSessionPolicy(nextPolicy)
                setSessionTotalSeconds(nextPolicy.sessionTotalSeconds)
                setTotalSecondsRemaining(nextPolicy.sessionTotalSeconds)
                setFocusSecondsRemaining(nextPolicy.focusIntervalSeconds)
                setFocusBreakPending(false)
                setPhase('quiz')
                setPhaseSecondsRemaining(0)
                setCycleCount(1)
                setGameView(pickRandomGameView())
                setGameSeed(Date.now())
                setStudyActiveSeconds(sharedProgress?.activeSeconds ?? 0)
                setStudyIdleSeconds(sharedProgress?.idleSeconds ?? 0)
                setQuizElapsedSeconds(sharedProgress?.quizSeconds ?? 0)
                setBreakElapsedSeconds(sharedProgress?.breakSeconds ?? 0)
                setGameBreakElapsedSeconds(sharedProgress?.gameBreakSeconds ?? 0)

                if (taskId) {
                    if (task?.status !== 'completed') {
                        let activeSessionId: string | null = sharedProgress?.sessionId ?? null
                        const key = getSessionKey(taskId)

                        if (!activeSessionId) {
                            try {
                                activeSessionId = window.localStorage.getItem(key)
                            } catch {
                                activeSessionId = null
                            }
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

                        if (activeSessionId) {
                            saveLearningSessionProgress(taskId, {
                                sessionId: activeSessionId,
                                activeSeconds: sharedActiveSeconds,
                                idleSeconds: sharedProgress?.idleSeconds ?? 0,
                                studySeconds: sharedActiveSeconds,
                                quizSeconds: sharedProgress?.quizSeconds ?? 0,
                                breakSeconds: sharedProgress?.breakSeconds ?? 0,
                                gameBreakSeconds: sharedProgress?.gameBreakSeconds ?? 0,
                            })
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
    }, [aiAssignmentId, aiDocumentId, durationQueryMinutes, lessonId, router, supabase, taskId])

    const hasQuizSession = Boolean(lessonId || aiDocumentId)

    useEffect(() => {
        if (!hasQuizSession || loading || finished || phase !== 'quiz') return
        const timer = window.setInterval(() => {
            setQuizElapsedSeconds((prev) => prev + 1)
            setTotalSecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [finished, hasQuizSession, loading, phase])

    useEffect(() => {
        if (hasQuizSession && totalSecondsRemaining === 0 && !finished && !loading) {
            const timer = window.setTimeout(() => {
                void handleFinish()
            }, 0)
            return () => window.clearTimeout(timer)
        }
    }, [finished, handleFinish, hasQuizSession, loading, totalSecondsRemaining])

    useEffect(() => {
        if (!hasQuizSession || loading || finished || phase !== 'quiz' || focusBreakPending) return
        const timer = window.setInterval(() => {
            setFocusSecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    setFocusBreakPending(true)
                    setPhase('choice')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [finished, focusBreakPending, hasQuizSession, loading, phase])

    useEffect(() => {
        if (!hasQuizSession || loading || finished || (phase !== 'break' && phase !== 'game')) return
        const timer = window.setInterval(() => {
            if (phase === 'game') {
                setGameBreakElapsedSeconds((prev) => prev + 1)
            } else {
                setBreakElapsedSeconds((prev) => prev + 1)
            }
            setPhaseSecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [finished, hasQuizSession, loading, phase])

    useEffect(() => {
        if (!hasQuizSession || loading || finished || (phase !== 'break' && phase !== 'game') || phaseSecondsRemaining > 0) return
        const timer = window.setTimeout(() => {
            if (phase === 'game') {
                setPhase('break')
                setPhaseSecondsRemaining(Math.min(sessionPolicy.breakSeconds, Math.max(1, totalSecondsRemaining)))
                return
            }

            setFocusSecondsRemaining(sessionPolicy.focusIntervalSeconds)
            setFocusBreakPending(false)
            setPhase('quiz')
            setSelected(null)
            setConfirmed(false)
            setCycleCount((prev) => prev + 1)
        }, 0)
        return () => window.clearTimeout(timer)
    }, [finished, hasQuizSession, loading, phase, phaseSecondsRemaining, sessionPolicy.breakSeconds, sessionPolicy.focusIntervalSeconds, totalSecondsRemaining])

    useEffect(() => {
        if (!hasQuizSession || loading || finished || phase !== 'game') return

        const onGameComplete = (event: MessageEvent) => {
            const data = event.data as { type?: string } | null
            if (!data || data.type !== 'mindory:game-complete') return
            setPhase('break')
            setPhaseSecondsRemaining(Math.min(sessionPolicy.breakSeconds, Math.max(1, totalSecondsRemaining)))
        }

        window.addEventListener('message', onGameComplete)
        return () => window.removeEventListener('message', onGameComplete)
    }, [finished, hasQuizSession, loading, phase, sessionPolicy.breakSeconds, totalSecondsRemaining])

    useEffect(() => {
        if (!taskId || loading || finished) return
        saveLearningSessionProgress(taskId, {
            sessionId,
            activeSeconds: studyActiveSeconds,
            idleSeconds: studyIdleSeconds,
            studySeconds: studyActiveSeconds,
            quizSeconds: quizElapsedSeconds,
            breakSeconds: breakElapsedSeconds,
            gameBreakSeconds: gameBreakElapsedSeconds,
        })
    }, [breakElapsedSeconds, finished, gameBreakElapsedSeconds, loading, quizElapsedSeconds, sessionId, studyActiveSeconds, studyIdleSeconds, taskId])

    const filteredSubjects = useMemo(() => {
        if (!subjectIdFilter) return subjects
        return subjects.filter((subject) => subject.id === subjectIdFilter)
    }, [subjectIdFilter, subjects])

    const quiz = quizzes[currentQ] || null
    const score = quizzes.reduce((sum, q, idx) => (answers[idx] === q.correct_index ? sum + 1 : sum), 0)
    const answeredCount = answers.filter((a) => a !== null).length
    const progressPct = quizzes.length > 0 ? Math.round((answeredCount / quizzes.length) * 100) : 0
    const isCorrect = selected !== null && quiz ? selected === quiz.correct_index : false
    const isQuizPhase = phase === 'quiz'
    const focusMinutesLabel = Math.max(1, Math.round(sessionPolicy.focusIntervalSeconds / 60))
    const isAssignedQuizFlow = Boolean(taskId || aiAssignmentId)
    const phaseLabel = phase === 'quiz' ? 'Làm câu hỏi' : phase === 'choice' ? 'Chọn nghỉ' : phase === 'game' ? 'Mini game' : 'Giải lao'

    const handleConfirm = () => {
        if (!isQuizPhase) return
        if (selected === null || !quiz) return
        const nextAnswers = [...answers]
        nextAnswers[currentQ] = selected
        setAnswers(nextAnswers)
        setConfirmed(true)
    }

    const handleNext = () => {
        if (!isQuizPhase) return
        const nextQuestionIndex = quizzes.length > 0 ? (currentQ + 1) % quizzes.length : 0

        setCurrentQ(nextQuestionIndex)
        setSelected(null)
        setConfirmed(false)

        if (focusBreakPending) {
            setPhase('choice')
        }
    }

    const startBreak = () => {
        setPhase('break')
        setPhaseSecondsRemaining(Math.min(sessionPolicy.breakSeconds, Math.max(1, totalSecondsRemaining)))
    }

    const startMiniGame = () => {
        setPhase('game')
        setPhaseSecondsRemaining(Math.min(sessionPolicy.gameBreakSeconds, Math.max(1, totalSecondsRemaining)))
        setGameView(pickRandomGameView())
        setGameSeed(Date.now())
    }

    const handleSkip = () => {
        if (!isQuizPhase) return
        const nextQuestionIndex = quizzes.length > 0 ? (currentQ + 1) % quizzes.length : 0
        setCurrentQ(nextQuestionIndex)
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
        setXpAwarded(0)
        setTotalSecondsRemaining(sessionTotalSeconds)
        setFocusSecondsRemaining(sessionPolicy.focusIntervalSeconds)
        setFocusBreakPending(false)
        setPhase('quiz')
        setPhaseSecondsRemaining(0)
        setCycleCount(1)
        setGameView(pickRandomGameView())
        setGameSeed(Date.now())
        setQuizElapsedSeconds(0)
        setBreakElapsedSeconds(0)
        setGameBreakElapsedSeconds(0)
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

    if (!lessonId && !aiDocumentId) {
        const activeTasks = tasks.filter((task) => task.status !== 'completed')
        const activeAiAssignments = aiAssignments.filter((assignment) => assignment.status === 'assigned')

        return (
            <div className="max-w-6xl mx-auto p-8 space-y-7">
                <div className="rounded-[2rem] bg-gradient-to-r from-slate-900 to-indigo-900 p-7 text-white">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Kiểm tra</p>
                    <h1 className="text-3xl font-black mt-2">Learning Map tích hợp kiểm tra</h1>
                    <p className="text-indigo-200 mt-2">Chọn môn, chọn bài và bắt đầu trắc nghiệm với Pomodoro.</p>
                </div>

                {(activeTasks.length > 0 || activeAiAssignments.length > 0) && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">Bài kiểm tra từ nhiệm vụ</h2>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{activeTasks.length + activeAiAssignments.length} bài</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {activeTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Task Quiz</p>
                                    <h3 className="text-lg font-black text-gray-800 mt-1 line-clamp-1">{task.lessons?.title ?? 'Bài học'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.lessons?.description ?? 'Làm bài kiểm tra để hoàn thành nhiệm vụ.'}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-bold text-gray-500">Pomodoro: {task.session_duration_minutes} phút</p>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-600">+{COMPLETION_XP} XP</span>
                                    </div>
                                    <Link
                                        href={`/child/quiz?taskId=${task.id}&lessonId=${task.lesson_id}&lessonTitle=${encodeURIComponent(task.lessons?.title ?? 'Bài học')}&duration=${task.session_duration_minutes}`}
                                        className="mt-3 inline-flex justify-center w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black"
                                    >
                                        Làm kiểm tra ngay
                                    </Link>
                                </div>
                            ))}
                            {activeAiAssignments.map((assignment) => {
                                const document = Array.isArray(assignment.pdf_documents) ? assignment.pdf_documents[0] : assignment.pdf_documents
                                const title = assignment.documentTitle ?? assignment.document?.title ?? document?.title ?? 'Bài AI'

                                return (
                                    <div key={assignment.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-500">AI Quiz</p>
                                        <h3 className="text-lg font-black text-gray-800 mt-1 line-clamp-1">{title}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">Bố mẹ đã giao bài AI này cho bé.</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-bold text-gray-500">Pomodoro: {Math.round(buildSessionPolicy({ mode: 'assigned-quiz' }).sessionTotalSeconds / 60)} phút</p>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-600">+{COMPLETION_XP} XP</span>
                                        </div>
                                        <Link
                                            href={`/child/quiz?aiAssignmentId=${assignment.id}&aiDocumentId=${assignment.document_id}&lessonTitle=${encodeURIComponent(title)}`}
                                            className="mt-3 inline-flex justify-center w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black"
                                        >
                                            Làm kiểm tra ngay
                                        </Link>
                                    </div>
                                )
                            })}
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
                xpAwarded={xpAwarded}
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
                    <p className="text-[11px] font-black text-indigo-500">Chu kỳ {cycleCount}</p>
                </div>
            </div>

            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Luồng Pomodoro Xen Kẽ</p>
                    <p className="text-sm font-black text-indigo-900 mt-1">Pha hiện tại: {phaseLabel}</p>
                    <p className="text-xs font-bold text-indigo-700 mt-1">
                        Sau {focusMinutesLabel} phút tập trung, bé được chọn nghỉ {sessionPolicy.breakSeconds} giây hoặc chơi game {sessionPolicy.gameBreakSeconds} giây sau khi xong câu hiện tại{isAssignedQuizFlow ? '. Đây chỉ là nghỉ ngắn, không phải phần thưởng chính.' : '.'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Còn lại toàn phiên</p>
                    <p className={cn('text-2xl font-black tabular-nums', totalSecondsRemaining <= 60 ? 'text-red-500' : 'text-indigo-900')}>{formatTime(totalSecondsRemaining)}</p>
                </div>
            </div>

            {phase === 'game' ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-0 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-black text-amber-800">Mini game: {formatTime(phaseSecondsRemaining)}</p>
                        <button onClick={startBreak} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600">
                            Kết thúc game
                        </button>
                    </div>
                    <iframe
                        key={`${gameView}-${gameSeed}`}
                        src={`/child/games?embed=1&view=${gameView}&randomLevel=1&seed=${gameSeed}`}
                        className="h-[560px] w-full border-0 bg-white"
                        title="Mini game"
                    />
                </div>
            ) : phase === 'choice' ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600">Đến giờ reset</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-800">Bé muốn nghỉ kiểu nào?</h2>
                    <p className="mt-2 text-sm font-bold text-slate-500">Chọn một khoảng ngắn để đầu óc nhẹ hơn rồi quay lại câu tiếp theo.</p>
                    <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button onClick={startBreak} className="rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white hover:bg-sky-600">
                            Nghỉ {sessionPolicy.breakSeconds} giây
                        </button>
                        <button onClick={startMiniGame} className="rounded-2xl bg-amber-500 px-5 py-5 text-base font-black text-white hover:bg-amber-600">
                            Chơi game {sessionPolicy.gameBreakSeconds} giây
                        </button>
                    </div>
                </div>
            ) : phase === 'break' ? (
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-10 text-center shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-sky-600">Giải lao</p>
                    <p className="mt-2 text-base font-bold text-sky-700">Nghỉ ngắn rồi hệ thống tự quay lại màn câu hỏi.</p>
                    <p className="mt-4 text-6xl font-black tabular-nums text-sky-900">{formatTime(phaseSecondsRemaining)}</p>
                </div>
            ) : (
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
                                    Câu tiếp theo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pomodoro</p>
                            <p className={cn('text-5xl font-black mt-2 tabular-nums', totalSecondsRemaining <= 60 ? 'text-red-500' : 'text-slate-800')}>
                                {formatTime(totalSecondsRemaining)}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Đang ở pha: {phaseLabel}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-violet-500 rounded-3xl p-5 text-white">
                            <p className="text-xs font-black uppercase tracking-widest text-purple-200">Tiến độ</p>
                            <p className="text-sm font-bold mt-2">Đúng: {score} / {quizzes.length}</p>
                            <p className="text-sm font-bold">Đã trả lời: {answeredCount} câu</p>
                            <p className="text-sm font-bold">Còn {formatTime(focusSecondsRemaining)} đến lần nghỉ tiếp theo</p>
                        </div>

                        <button onClick={handleSkip} className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-sm">
                            Skip Question
                        </button>
                    </div>
                </div>
            )}
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
