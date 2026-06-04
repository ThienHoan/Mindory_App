'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import { AIAssignment, AIQuizDocument, api, Lesson, Task } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import {
    DEFAULT_FREE_QUIZ_SECONDS,
    DEFAULT_GAME_BREAK_SECONDS,
    buildSessionPolicy,
} from '@/lib/learning/session-policy'
import { loadLearningSessionProgress, saveLearningSessionProgress } from '@/lib/learning/session-storage'

type StudyPhase = 'study' | 'choice' | 'game' | 'break' | 'done'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

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
const PDF_FOCUS_BLOCK_SECONDS = 4 * 60
const IDLE_AFTER_SECONDS = 90
const PROGRESS_MAX_AGE_MS = 24 * 60 * 60 * 1000
const STUDY_PROGRESS_PREFIX = 'mindory:study-progress:'
const RANDOM_GAME_VIEWS = ['memory', 'maze', 'music'] as const

function formatTime(seconds: number) {
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function clampPage(page: number, min: number, max: number) {
    return Math.min(Math.max(page, min), max)
}

type AIAssignmentDocument = Pick<AIQuizDocument, 'id' | 'title'> & Partial<Pick<AIQuizDocument, 'file_url' | 'created_at'>>

function getAiAssignmentDocument(documents: AIAssignment['pdf_documents']): AIAssignmentDocument | null {
    if (Array.isArray(documents)) return documents[0] ?? null
    return documents ?? null
}

function getAiAssignmentTitle(assignment: AIAssignment) {
    const document = getAiAssignmentDocument(assignment.pdf_documents)
    return assignment.documentTitle ?? assignment.document?.title ?? document?.title ?? 'Bài AI'
}

function getAiAssignmentFileUrl(assignment: AIAssignment) {
    const document = getAiAssignmentDocument(assignment.pdf_documents)
    return assignment.pdfUrl ?? assignment.document?.file_url ?? document?.file_url ?? ''
}

function getAiPdfStoragePath(fileUrl: string) {
    const trimmed = fileUrl.trim()
    if (!trimmed) return ''

    if (trimmed.startsWith('storage:')) {
        return trimmed.replace(/^storage:/, '').replace(/^\/+/, '')
    }

    try {
        const url = new URL(trimmed)
        const markers = ['/storage/v1/object/sign/pdfs/', '/storage/v1/object/public/pdfs/']
        for (const marker of markers) {
            const index = url.pathname.indexOf(marker)
            if (index >= 0) return decodeURIComponent(url.pathname.slice(index + marker.length))
        }
        return ''
    } catch {
        return trimmed.replace(/^pdfs\//, '').replace(/^\/+/, '')
    }
}

function resolveAiPdfUrl(fileUrl: string, supabase: ReturnType<typeof createClient>) {
    const storagePath = getAiPdfStoragePath(fileUrl)
    if (storagePath) {
        const { data } = supabase.storage.from('pdfs').getPublicUrl(storagePath)
        return data.publicUrl
    }

    return fileUrl.trim()
}

function pickRandomGameView() {
    return RANDOM_GAME_VIEWS[Math.floor(Math.random() * RANDOM_GAME_VIEWS.length)]
}

function getStudyProgressKey(taskId: string | null, lessonId: string) {
    return `${STUDY_PROGRESS_PREFIX}${taskId ? `task:${taskId}` : `lesson:${lessonId}`}`
}

function BookPdfViewer({
    pdfUrl,
    title,
    startPage = 1,
    endPage,
    totalPages,
}: {
    pdfUrl: string
    title: string
    startPage?: number
    endPage?: number
    totalPages?: number
}) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(Math.max(1, startPage))
    const [pageWidth, setPageWidth] = useState(680)
    const [flipStage, setFlipStage] = useState<'idle' | 'out' | 'in'>('idle')
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')

    const minPage = Math.max(1, startPage)
    const knownLastPage = numPages ?? totalPages ?? endPage ?? minPage
    const maxPage = Math.max(minPage, Math.min(endPage ?? knownLastPage, knownLastPage))
    const pdfFile = useMemo(() => `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`, [pdfUrl])

    useEffect(() => {
        setNumPages(null)
        setPageNumber(Math.max(1, startPage))
        setFlipStage('idle')
    }, [pdfUrl, startPage])

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === 'undefined') return

        const observer = new ResizeObserver(([entry]) => {
            setPageWidth(Math.min(860, Math.max(280, entry.contentRect.width - 32)))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        setPageNumber((current) => clampPage(current, minPage, maxPage))
    }, [maxPage, minPage])

    function turnTo(nextPage: number) {
        const target = clampPage(nextPage, minPage, maxPage)
        if (target === pageNumber || flipStage !== 'idle') return

        setFlipDirection(target > pageNumber ? 'next' : 'prev')
        setFlipStage('out')

        window.setTimeout(() => {
            setPageNumber(target)
            setFlipStage('in')
        }, 170)

        window.setTimeout(() => setFlipStage('idle'), 340)
    }

    const flipTransform =
        flipStage === 'out'
            ? flipDirection === 'next'
                ? 'rotateY(-74deg)'
                : 'rotateY(74deg)'
            : flipStage === 'in'
                ? flipDirection === 'next'
                    ? 'rotateY(10deg)'
                    : 'rotateY(-10deg)'
                : 'rotateY(0deg)'

    return (
        <section className="h-full min-h-[620px] rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-purple-500">Tài liệu PDF</p>
                    <p className="text-sm font-bold text-gray-600">Trang {pageNumber}/{maxPage}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => turnTo(pageNumber - 1)}
                        disabled={pageNumber <= minPage || flipStage !== 'idle'}
                        className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-xs font-black text-purple-600 shadow-sm transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Trang trước
                    </button>
                    <button
                        type="button"
                        onClick={() => turnTo(pageNumber + 1)}
                        disabled={pageNumber >= maxPage || flipStage !== 'idle'}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Trang sau
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="min-h-[520px] overflow-hidden rounded-2xl bg-[#f8f4ec] px-2 py-5 shadow-inner [perspective:1400px]">
                <div
                    className="mx-auto origin-left rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
                    style={{
                        maxWidth: pageWidth,
                        transform: flipTransform,
                        transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                        transition: 'transform 170ms ease, opacity 170ms ease',
                        opacity: flipStage === 'out' ? 0.68 : 1,
                    }}
                >
                    <Document
                        file={pdfFile}
                        onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages)
                            setPageNumber((current) => clampPage(current, minPage, Math.min(endPage ?? numPages, numPages)))
                        }}
                        loading={<div className="p-10 text-center text-sm font-bold text-gray-400">Đang tải PDF...</div>}
                        error={
                            <div className="p-8 text-center">
                                <p className="text-sm font-bold text-red-500">Không thể nhúng PDF này.</p>
                                <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                                    Mở tài liệu gốc
                                </a>
                            </div>
                        }
                    >
                        <Page
                            key={pageNumber}
                            pageNumber={pageNumber}
                            width={pageWidth}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            loading={<div className="p-10 text-center text-sm font-bold text-gray-400">Đang mở trang...</div>}
                        />
                    </Document>
                </div>
            </div>
            <p className="mt-3 text-center text-xs font-bold text-gray-400">{title}</p>
        </section>
    )
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
            focusSecondsRemaining: parsed.focusSecondsRemaining ?? PDF_FOCUS_BLOCK_SECONDS,
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
    const aiAssignmentId = searchParams.get('aiAssignmentId')
    const aiDocumentId = searchParams.get('aiDocumentId') || searchParams.get('documentId')
    const isTaskStudy = Boolean(taskId)
    const isAiStudy = Boolean(aiAssignmentId || aiDocumentId)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [task, setTask] = useState<Task | null>(null)
    const [pdfUrl, setPdfUrl] = useState('')
    const [phase, setPhase] = useState<StudyPhase>('study')
    const [studySecondsRemaining, setStudySecondsRemaining] = useState(DEFAULT_STUDY_SECONDS)
    const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(PDF_FOCUS_BLOCK_SECONDS)
    const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(0)
    const [sessionTotalSeconds, setSessionTotalSeconds] = useState(DEFAULT_STUDY_SECONDS)
    const [activeSeconds, setActiveSeconds] = useState(0)
    const [idleSeconds, setIdleSeconds] = useState(0)
    const [isActivelyLearning, setIsActivelyLearning] = useState(true)
    const [cycleCount, setCycleCount] = useState(1)
    const [progressKey, setProgressKey] = useState<string | null>(null)
    const [aiQuizHref, setAiQuizHref] = useState<string | null>(null)
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
        ? aiQuizHref ?? (task
            ? `/child/quiz?taskId=${task.id}&lessonId=${effectiveLessonId}&lessonTitle=${encodeURIComponent(lesson?.title ?? 'Bài học')}&duration=${task.session_duration_minutes}`
            : `/child/quiz?lessonId=${effectiveLessonId}&lessonTitle=${encodeURIComponent(lesson?.title ?? 'Bài học')}`)
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
                let loadedLesson: Lesson
                let nextPdfUrl = ''
                let nextProgressKey = ''
                let nextAiQuizHref: string | null = null

                if (!loadedTask && isAiStudy) {
                    const assignments = await api.aiAssignments.listMine()
                    const assignment = assignments.find((item) => (
                        (aiAssignmentId && item.id === aiAssignmentId) ||
                        (aiDocumentId && item.document_id === aiDocumentId)
                    ))

                    if (!assignment) {
                        throw new Error('Không tìm thấy bài AI được giao.')
                    }

                    const playable = await api.aiQuizzes.getPlayable(assignment.document_id)
                    const title = playable.document?.title ?? getAiAssignmentTitle(assignment)
                    const aiPdfUrl = resolveAiPdfUrl(playable.document?.file_url ?? getAiAssignmentFileUrl(assignment), supabase)

                    if (!aiPdfUrl) {
                        throw new Error('Bài AI này chưa có PDF để học.')
                    }

                    loadedLesson = {
                        id: assignment.document_id,
                        subject_id: 'ai-pdf',
                        title,
                        description: 'Bài PDF AI được phụ huynh giao. Bé học tài liệu trước rồi làm kiểm tra.',
                        pdf_url: aiPdfUrl,
                        total_pages: 1,
                    }
                    nextPdfUrl = aiPdfUrl
                    nextProgressKey = getStudyProgressKey(null, `ai:${assignment.id}`)
                    nextAiQuizHref = `/child/quiz?aiAssignmentId=${assignment.id}&aiDocumentId=${assignment.document_id}&lessonTitle=${encodeURIComponent(title)}`
                } else {
                    const nextLessonId = loadedTask?.lesson_id ?? lessonId
                    if (!nextLessonId) {
                        throw new Error('Thiếu bài học để mở phòng học PDF.')
                    }

                    const [baseLesson, pdf] = await Promise.all([
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

                    loadedLesson = baseLesson
                    nextPdfUrl = pdf.url
                    nextProgressKey = getStudyProgressKey(loadedTask?.id ?? null, nextLessonId)
                }

                if (!nextProgressKey) {
                    throw new Error('Thiếu bài học để mở phòng học PDF.')
                }

                if (!active) return

                const policy = buildSessionPolicy({ durationMinutes: loadedTask?.session_duration_minutes, assigned: Boolean(loadedTask), mode: 'study' })
                const sessionSeconds = policy.sessionTotalSeconds
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
                setPdfUrl(nextPdfUrl)
                setProgressKey(nextProgressKey)
                setAiQuizHref(nextAiQuizHref)
                setSessionTotalSeconds(savedProgress?.sessionTotalSeconds ?? sessionSeconds)
                setStudySecondsRemaining(savedProgress?.studySecondsRemaining ?? sessionSeconds)
                setFocusSecondsRemaining(Math.min(savedProgress?.focusSecondsRemaining ?? PDF_FOCUS_BLOCK_SECONDS, PDF_FOCUS_BLOCK_SECONDS))
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
    }, [aiAssignmentId, aiDocumentId, isAiStudy, lessonId, markActivity, supabase, taskId])

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
                if (prev <= 1) {
                    window.clearInterval(timer)
                    setPhase('choice')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [loading, phase])

    useEffect(() => {
        if (phase !== 'game' && phase !== 'break') return

        const timer = window.setInterval(() => {
            setPhaseSecondsRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    if (phase === 'game') {
                        setFocusSecondsRemaining(Math.min(PDF_FOCUS_BLOCK_SECONDS, Math.max(1, studySecondsRemaining)))
                        setCycleCount((prevCycle) => prevCycle + 1)
                        setPhase(studySecondsRemaining > 0 ? 'study' : 'done')
                    } else {
                        setFocusSecondsRemaining(Math.min(PDF_FOCUS_BLOCK_SECONDS, Math.max(1, studySecondsRemaining)))
                        setCycleCount((prevCycle) => prevCycle + 1)
                        setPhase(studySecondsRemaining > 0 ? 'study' : 'done')
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [phase, studySecondsRemaining])

    const continueStudying = () => {
        markActivity()
        setFocusSecondsRemaining(Math.min(PDF_FOCUS_BLOCK_SECONDS, Math.max(1, studySecondsRemaining)))
        setCycleCount((prevCycle) => prevCycle + 1)
        setPhase(studySecondsRemaining > 0 ? 'study' : 'done')
        setPhaseSecondsRemaining(0)
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
                    <div className="rounded-2xl bg-blue-50 px-4 py-2">
                        <p className="text-[10px] font-black uppercase text-blue-400">Đến lựa chọn</p>
                        <p className="text-lg font-black tabular-nums text-blue-700">{formatTime(focusSecondsRemaining)}</p>
                    </div>
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
                    <BookPdfViewer pdfUrl={pdfUrl} title={lesson.title} totalPages={lesson.total_pages} />
                ) : (
                    <div className="flex h-full min-h-[620px] items-center justify-center text-sm font-bold text-slate-400">Bài học chưa có PDF.</div>
                )}

                {phase === 'choice' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-2xl">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-500">Đã học 4 phút</p>
                            <h2 className="mt-2 text-3xl font-black text-slate-800">Bé muốn học tiếp hay chơi game?</h2>
                            <p className="mt-2 text-sm font-bold text-slate-500">Chọn học tiếp để quay lại PDF ngay, hoặc chơi mini game 60 giây rồi hệ thống tự đưa bé về học.</p>
                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button onClick={continueStudying} className="rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white hover:bg-sky-600">
                                    Học tiếp
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
                            <p className="text-xs font-black uppercase tracking-widest text-amber-600">Hết giờ sẽ tự quay lại PDF</p>
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
