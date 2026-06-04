'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api, Lesson, Task } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import {
    DEFAULT_BREAK_SECONDS,
    DEFAULT_FREE_QUIZ_SECONDS,
    DEFAULT_GAME_BREAK_SECONDS,
    buildSessionPolicy,
} from '@/lib/learning/session-policy'
import { loadLearningSessionProgress, saveLearningSessionProgress } from '@/lib/learning/session-storage'

type StudyPhase = 'study' | 'choice' | 'game' | 'break' | 'done'

interface SavedStudyProgress {
    activeSeconds: number
    idleSeconds: number
    studySecondsRemaining: number
    focusSecondsRemaining: number
    phaseSecondsRemaining: number
    sessionTotalSeconds: number
    cycleCount: number
    phase: StudyPhase
    updatedAt: number
}

const DEFAULT_STUDY_SECONDS = DEFAULT_FREE_QUIZ_SECONDS
const IDLE_AFTER_SECONDS = 90
const PROGRESS_MAX_AGE_MS = 24 * 60 * 60 * 1000
const STUDY_PROGRESS_PREFIX = 'mindory:study-progress:'
const RANDOM_GAME_VIEWS = ['memory', 'maze', 'music'] as const

function formatTime(seconds: number) {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function pickRandomGameView() {
    return RANDOM_GAME_VIEWS[Math.floor(Math.random() * RANDOM_GAME_VIEWS.length)]
}

function getStudyProgressKey(taskId: string | null, lessonId: string) {
    return `${STUDY_PROGRESS_PREFIX}${taskId ? `task:${taskId}` : `lesson:${lessonId}`}`
}

function loadSavedProgress(key: string): SavedStudyProgress | null {
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<SavedStudyProgress>
        if (!parsed.updatedAt || Date.now() - parsed.updatedAt > PROGRESS_MAX_AGE_MS) {
            window.localStorage.removeItem(key)
            return null
        }
        if (typeof parsed.studySecondsRemaining !== 'number' || parsed.studySecondsRemaining <= 0) return null
        return {
            activeSeconds: parsed.activeSeconds ?? 0,
            idleSeconds: parsed.idleSeconds ?? 0,
            studySecondsRemaining: parsed.studySecondsRemaining,
            focusSecondsRemaining: parsed.focusSecondsRemaining ?? buildSessionPolicy({ mode: 'study' }).focusIntervalSeconds,
            phaseSecondsRemaining: parsed.phaseSecondsRemaining ?? 0,
            sessionTotalSeconds: parsed.sessionTotalSeconds ?? DEFAULT_STUDY_SECONDS,
            cycleCount: parsed.cycleCount ?? 1,
            phase: parsed.phase === 'done' ? 'done' : parsed.phase === 'choice' ? 'choice' : parsed.phase === 'game' ? 'game' : parsed.phase === 'break' ? 'break' : 'study',
            updatedAt: parsed.updatedAt,
        }
    } catch {
        return null
    }
}

function StudyContent() {
    const searchParams = useSearchParams()
    const supabase = useMemo(() => createClient(), [])
    const taskId = searchParams.get('taskId')
    const lessonId = searchParams.get('lessonId')
    const isTaskStudy = Boolean(taskId)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [task, setTask] = useState<Task | null>(null)
    const [pdfUrl, setPdfUrl] = useState('')
    const [phase, setPhase] = useState<StudyPhase>('study')
    const [studySecondsRemaining, setStudySecondsRemaining] = useState(DEFAULT_STUDY_SECONDS)
    const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(() => buildSessionPolicy({ mode: 'study' }).focusIntervalSeconds)
    const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(0)
    const [sessionTotalSeconds, setSessionTotalSeconds] = useState(DEFAULT_STUDY_SECONDS)
    const [activeSeconds, setActiveSeconds] = useState(0)
    const [idleSeconds, setIdleSeconds] = useState(0)
    const [isActivelyLearning, setIsActivelyLearning] = useState(true)
    const [cycleCount, setCycleCount] = useState(1)
    const [progressKey, setProgressKey] = useState<string | null>(null)
    const [gameView, setGameView] = useState<(typeof RANDOM_GAME_VIEWS)[number]>(() => pickRandomGameView())
    const [gameSeed, setGameSeed] = useState(() => Date.now())
    const lastActivityAtRef = useRef(0)

    const activePolicy = useMemo(
        () => buildSessionPolicy({ durationMinutes: task?.session_duration_minutes, assigned: Boolean(task), mode: 'study' }),
        [task]
    )
    const requiredActiveSeconds = isTaskStudy ? Math.min(activePolicy.minActiveBeforeQuizSeconds, Math.max(1, sessionTotalSeconds)) : 0
    const canStartQuiz = !isTaskStudy || activeSeconds >= requiredActiveSeconds || phase === 'done'

    const markActivity = useCallback(() => {
        lastActivityAtRef.current = Date.now()
        setIsActivelyLearning(true)
    }, [])

    const effectiveLessonId = lesson?.id ?? lessonId ?? task?.lesson_id ?? ''
    const quizHref = effectiveLessonId
        ? task
            ? `/child/quiz?taskId=${task.id}&lessonId=${effectiveLessonId}&lessonTitle=${encodeURIComponent(lesson?.title ?? 'Bài học')}&duration=${task.session_duration_minutes}`
            : `/child/quiz?lessonId=${effectiveLessonId}&lessonTitle=${encodeURIComponent(lesson?.title ?? 'Bài học')}`
        : '/child/lesson'

    const phaseLabel = useMemo(() => {
        if (phase === 'study') return 'Đang học'
        if (phase === 'choice') return 'Chọn nghỉ'
        if (phase === 'game') return 'Mini game'
        if (phase === 'break') return 'Nghỉ ngắn'
        return 'Hoàn thành phiên học'
    }, [phase])

    useEffect(() => {
        let active = true

        async function load() {
            try {
                setLoading(true)
                setError(null)

                const loadedTask = taskId ? await api.tasks.get(taskId) : null
                const nextLessonId = loadedTask?.lesson_id ?? lessonId
                if (!nextLessonId) {
                    throw new Error('Thiếu bài học để mở phòng học PDF.')
                }

                const [loadedLesson, pdf] = await Promise.all([
                    loadedTask?.lessons
                        ? Promise.resolve({
                            id: loadedTask.lessons.id ?? loadedTask.lesson_id,
                            subject_id: '',
                            title: loadedTask.lessons.title,
                            description: loadedTask.lessons.description,
                            pdf_url: loadedTask.lessons.pdf_url,
                            pdf_path: loadedTask.lessons.pdf_path,
                            total_pages: loadedTask.lessons.total_pages,
                        } satisfies Lesson)
                        : api.lessons.get(nextLessonId),
                    api.lessons.getPdfUrl(nextLessonId),
                ])

                if (!active) return

                const policy = buildSessionPolicy({ durationMinutes: loadedTask?.session_duration_minutes, assigned: Boolean(loadedTask), mode: 'study' })
                const sessionSeconds = policy.sessionTotalSeconds
                const nextProgressKey = getStudyProgressKey(loadedTask?.id ?? null, nextLessonId)
                const savedProgress = loadSavedProgress(nextProgressKey)
                const sharedProgress = loadedTask?.id ? loadLearningSessionProgress(loadedTask.id) : null
                const nextActiveSeconds = Math.max(sharedProgress?.activeSeconds ?? 0, savedProgress?.activeSeconds ?? 0)
                const nextIdleSeconds = Math.max(sharedProgress?.idleSeconds ?? 0, savedProgress?.idleSeconds ?? 0)

                if (loadedTask?.id && loadedTask.status !== 'completed' && !sharedProgress?.sessionId) {
                    try {
                        const {
                            data: { user },
                        } = await supabase.auth.getUser()
                        if (user) {
                            const session = await api.sessions.start(loadedTask.id, user.id)
                            if (session?.id) {
                                saveLearningSessionProgress(loadedTask.id, {
                                    sessionId: session.id,
                                    activeSeconds: nextActiveSeconds,
                                    idleSeconds: nextIdleSeconds,
                                    studySeconds: nextActiveSeconds,
                                })
                            }
                        }
                    } catch {
                        // Quiz can still create the session if study could not start it.
                    }
                }

                setTask(loadedTask)
                setLesson(loadedLesson)
                setPdfUrl(pdf.url)
                setProgressKey(nextProgressKey)
                setSessionTotalSeconds(savedProgress?.sessionTotalSeconds ?? sessionSeconds)
                setStudySecondsRemaining(savedProgress?.studySecondsRemaining ?? sessionSeconds)
                setFocusSecondsRemaining(Math.min(savedProgress?.focusSecondsRemaining ?? policy.focusIntervalSeconds, policy.focusIntervalSeconds))
                setPhaseSecondsRemaining(savedProgress?.phaseSecondsRemaining ?? 0)
                setActiveSeconds(nextActiveSeconds)
                setIdleSeconds(nextIdleSeconds)
                markActivity()
                setPhase(savedProgress?.phase ?? 'study')
                setCycleCount(savedProgress?.cycleCount ?? 1)
            } catch (e) {
                if (active) setError(e instanceof Error ? e.message : 'Không thể mở phòng học PDF.')
            } finally {
                if (active) setLoading(false)
            }
        }

        void load()
        return () => {
            active = false
        }
    }, [lessonId, markActivity, supabase, taskId])

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) {
                setIsActivelyLearning(false)
            } else {
                markActivity()
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('focus', markActivity)
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange)
            window.removeEventListener('focus', markActivity)
        }
    }, [markActivity])

    useEffect(() => {
        if (!progressKey || loading) return

        if (taskId) {
            saveLearningSessionProgress(taskId, {
                activeSeconds,
                idleSeconds,
                studySeconds: activeSeconds,
            })
        }

        if (phase === 'done') {
            try {
                window.localStorage.removeItem(progressKey)
            } catch {
                // ignore storage failures
            }
            return
        }

        const progress: SavedStudyProgress = {
            activeSeconds,
            idleSeconds,
            studySecondsRemaining,
            focusSecondsRemaining,
            phaseSecondsRemaining,
            sessionTotalSeconds,
            cycleCount,
            phase,
            updatedAt: Date.now(),
        }

        try {
            window.localStorage.setItem(progressKey, JSON.stringify(progress))
        } catch {
            // ignore storage failures
        }
    }, [activeSeconds, cycleCount, focusSecondsRemaining, idleSeconds, loading, phase, phaseSecondsRemaining, progressKey, sessionTotalSeconds, studySecondsRemaining, taskId])

    useEffect(() => {
        if (phase !== 'study' || loading) return

        const timer = window.setInterval(() => {
            const isRecent = Date.now() - lastActivityAtRef.current <= IDLE_AFTER_SECONDS * 1000
            const shouldCount = !document.hidden && isRecent

            setIsActivelyLearning(shouldCount)
            if (!shouldCount) {
                setIdleSeconds((prev) => prev + 1)
                return
            }

            setActiveSeconds((prev) => prev + 1)

            setStudySecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    setPhase('done')
                    return 0
                }
                return prev - 1
            })

            setFocusSecondsRemaining((prev) => {
                if (!isTaskStudy) return prev
                if (prev <= 1) {
                    window.clearInterval(timer)
                    setPhase('choice')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [isTaskStudy, loading, phase])

    useEffect(() => {
        if (phase !== 'game' && phase !== 'break') return

        const timer = window.setInterval(() => {
            setPhaseSecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    if (phase === 'game') {
                        setPhase('break')
                        setPhaseSecondsRemaining(Math.min(DEFAULT_BREAK_SECONDS, Math.max(1, studySecondsRemaining)))
                    } else {
                        setFocusSecondsRemaining(Math.min(activePolicy.focusIntervalSeconds, Math.max(1, studySecondsRemaining)))
                        setCycleCount((prevCycle) => prevCycle + 1)
                        setPhase(studySecondsRemaining > 0 ? 'study' : 'done')
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [activePolicy.focusIntervalSeconds, phase, studySecondsRemaining])

    const startBreak = () => {
        markActivity()
        setPhase('break')
        setPhaseSecondsRemaining(Math.min(DEFAULT_BREAK_SECONDS, Math.max(1, studySecondsRemaining)))
    }

    const startMiniGame = () => {
        markActivity()
        setGameView(pickRandomGameView())
        setGameSeed(Date.now())
        setPhase('game')
        setPhaseSecondsRemaining(Math.min(DEFAULT_GAME_BREAK_SECONDS, Math.max(1, studySecondsRemaining)))
    }

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !lesson) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-sm font-bold text-red-500">{error ?? 'Không tìm thấy bài học.'}</p>
                <Link href="/child/lesson" className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">
                    Về bài học
                </Link>
            </div>
        )
    }

    return (
        <div
            className="mx-auto flex h-full max-w-7xl flex-col gap-4 p-5"
            onPointerDown={markActivity}
            onPointerMove={markActivity}
            onKeyDown={markActivity}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-500">Phòng học PDF</p>
                    <h1 className="truncate text-xl font-black text-slate-800">{lesson.title}</h1>
                    <p className="text-xs font-bold text-slate-400">{isTaskStudy ? `Chu kỳ ${cycleCount} · ${phaseLabel}` : 'Tự học · Nhắc nghỉ nhẹ'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-center">
                    <div className="rounded-2xl bg-slate-50 px-4 py-2">
                        <p className="text-[10px] font-black uppercase text-slate-400">Còn phiên học</p>
                        <p className="text-lg font-black tabular-nums text-slate-800">{formatTime(studySecondsRemaining)}</p>
                    </div>
                    {isTaskStudy ? (
                        <div className="rounded-2xl bg-blue-50 px-4 py-2">
                            <p className="text-[10px] font-black uppercase text-blue-400">Đến lần nghỉ</p>
                            <p className="text-lg font-black tabular-nums text-blue-700">{formatTime(focusSecondsRemaining)}</p>
                        </div>
                    ) : null}
                    <div className="rounded-2xl bg-emerald-50 px-4 py-2">
                        <p className="text-[10px] font-black uppercase text-emerald-500">Học active</p>
                        <p className="text-lg font-black tabular-nums text-emerald-700">{formatTime(activeSeconds)}</p>
                    </div>
                    {canStartQuiz ? (
                        <Link href={quizHref} className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white hover:bg-purple-700">
                            Làm kiểm tra
                        </Link>
                    ) : (
                        <button disabled className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-400">
                            Cần {formatTime(requiredActiveSeconds - activeSeconds)} active
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold shadow-sm">
                <span className={isActivelyLearning ? 'text-emerald-600' : 'text-amber-600'}>
                    {isActivelyLearning ? 'Đang tính thời gian học' : 'Tạm dừng timer vì bé đang idle hoặc rời tab'}
                </span>
                <span className="text-slate-400">
                    Idle: {formatTime(idleSeconds)}{isTaskStudy ? ` · Cần active tối thiểu: ${formatTime(requiredActiveSeconds)}` : ' · Tự học không khóa kiểm tra'}
                </span>
                {!isActivelyLearning ? (
                    <button onClick={markActivity} className="rounded-xl bg-blue-50 px-3 py-2 font-black text-blue-700 hover:bg-blue-100">
                        Con đang học
                    </button>
                ) : null}
            </div>

            <div className="relative min-h-[620px] flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {pdfUrl ? (
                    <iframe src={pdfUrl} title={lesson.title} className="h-full min-h-[620px] w-full border-0 bg-slate-50" />
                ) : (
                    <div className="flex h-full min-h-[620px] items-center justify-center text-sm font-bold text-slate-400">Bài học chưa có PDF.</div>
                )}

                {phase === 'choice' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-2xl">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-500">Đến giờ reset</p>
                            <h2 className="mt-2 text-3xl font-black text-slate-800">Bé muốn nghỉ kiểu nào?</h2>
                            <p className="mt-2 text-sm font-bold text-slate-500">Nghỉ ngắn để quay lại học nhẹ hơn.</p>
                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button onClick={startBreak} className="rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white hover:bg-sky-600">
                                    Nghỉ 30 giây
                                </button>
                                <button onClick={startMiniGame} className="rounded-2xl bg-amber-500 px-5 py-5 text-base font-black text-white hover:bg-amber-600">
                                    Chơi game 60 giây
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {phase === 'game' ? (
                    <div className="absolute inset-0 z-20 flex flex-col bg-white">
                        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-black text-amber-800">Mini game: {formatTime(phaseSecondsRemaining)}</p>
                            <button onClick={startBreak} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600">
                                Kết thúc game
                            </button>
                        </div>
                        <iframe
                            key={`${gameView}-${gameSeed}`}
                            src={`/child/games?embed=1&view=${gameView}&randomLevel=1&seed=${gameSeed}`}
                            className="min-h-0 flex-1 border-0 bg-white"
                            title="Mini game"
                        />
                    </div>
                ) : null}

                {phase === 'break' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-50 p-4 text-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-sky-600">Nghỉ ngắn</p>
                            <p className="mt-3 text-7xl font-black tabular-nums text-sky-900">{formatTime(phaseSecondsRemaining)}</p>
                            <p className="mt-3 text-sm font-bold text-sky-700">Hết giờ hệ thống tự quay lại PDF.</p>
                        </div>
                    </div>
                ) : null}

                {phase === 'done' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-50 p-4 text-center">
                        <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl">
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Hoàn thành phiên học</p>
                            <h2 className="mt-2 text-3xl font-black text-slate-800">Sẵn sàng kiểm tra rồi</h2>
                            <p className="mt-2 text-sm font-bold text-slate-500">Bé đã học đủ thời lượng của phiên này.</p>
                            <Link href={quizHref} className="mt-6 inline-flex rounded-2xl bg-purple-600 px-6 py-3 text-sm font-black text-white hover:bg-purple-700">
                                Bắt đầu kiểm tra
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>

            {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="self-start text-xs font-bold text-blue-600 hover:underline">
                    Mở PDF ở tab mới nếu trình xem bị chặn
                </a>
            ) : null}
        </div>
    )
}

export default function LessonStudyPage() {
    return (
        <Suspense fallback={<div className="min-h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <StudyContent />
        </Suspense>
    )
}
