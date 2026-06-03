'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import { createClient } from '@/lib/supabase/client'
import { api, Lesson, Subject, Task } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type TaskItem = Task

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const CORE_SUBJECT_KEYS = ['toan', 'tieng viet', 'tieng anh']

function normalizeSubjectName(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

function isCoreSubject(name: string) {
    const normalized = normalizeSubjectName(name)
    return CORE_SUBJECT_KEYS.some((key) => normalized.includes(key))
}


function clampPage(page: number, min: number, max: number) {
    return Math.min(Math.max(page, min), max)
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
            setPageWidth(Math.min(760, Math.max(280, entry.contentRect.width - 32)))
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
        <section className="rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-4 shadow-sm">
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

            <div ref={containerRef} className="overflow-hidden rounded-2xl bg-[#f8f4ec] px-2 py-5 shadow-inner [perspective:1400px]">
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

function LessonContent() {
    const searchParams = useSearchParams()
    const supabase = useMemo(() => createClient(), [])

    const taskId = searchParams.get('taskId')
    const lessonId = searchParams.get('id')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [grade, setGrade] = useState<number>(1)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({})
    const [tasks, setTasks] = useState<TaskItem[]>([])

    const [detailSource, setDetailSource] = useState<'task' | 'free' | null>(null)
    const [detailTask, setDetailTask] = useState<TaskItem | null>(null)
    const [detailLesson, setDetailLesson] = useState<Lesson | null>(null)
    const [quizCount, setQuizCount] = useState(0)

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

                const [{ data: profile }, taskRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', user.id).single(),
                    api.tasks.listForChild(user.id),
                ])

                if (profile?.grade === null || profile?.grade === undefined) {
                    setError('Bé chưa được gán lớp. Vui lòng nhờ phụ huynh cập nhật hồ sơ.')
                    return
                }

                const nextGrade = profile.grade
                setGrade(nextGrade)

                const taskList = taskRes?.data ?? taskRes ?? []
                setTasks(taskList)

                if (taskId) {
                    const task = await api.tasks.get(taskId)
                    if (!task?.lesson_id) {
                        setError('Nhiệm vụ không hợp lệ.')
                        return
                    }

                    const lesson: Lesson = task.lessons
                        ? {
                            id: task.lessons.id ?? task.lesson_id,
                            title: task.lessons.title,
                            description: task.lessons.description,
                            pdf_url: task.lessons.pdf_url,
                            total_pages: task.lessons.total_pages,
                            subject_id: '',
                        }
                        : await api.lessons.get(task.lesson_id)

                    const quizzes = await api.quizzes.listByLesson(task.lesson_id)

                    setDetailSource('task')
                    setDetailTask(task)
                    setDetailLesson(lesson)
                    setQuizCount(Array.isArray(quizzes) ? quizzes.length : 0)
                    return
                }

                if (lessonId) {
                    const [lesson, quizzes] = await Promise.all([
                        api.lessons.get(lessonId),
                        api.quizzes.listByLesson(lessonId),
                    ])
                    setDetailSource('free')
                    setDetailTask(null)
                    setDetailLesson(lesson)
                    setQuizCount(Array.isArray(quizzes) ? quizzes.length : 0)
                    return
                }

                const subjectRes = await api.subjects.listByGrade(nextGrade)
                const subjectList: Subject[] = (subjectRes?.data ?? []).filter((subject) => isCoreSubject(subject.name))
                setSubjects(subjectList)

                const lessonResults = await Promise.all(
                    subjectList.map(async (subject) => {
                        const lessonRes = await api.lessons.listBySubject(subject.id)
                        return [subject.id, lessonRes?.data ?? []] as const
                    })
                )

                const lessonMap: Record<string, Lesson[]> = {}
                for (const [subjectId, list] of lessonResults) {
                    lessonMap[subjectId] = list
                }
                setLessonsBySubject(lessonMap)
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Không thể tải trang bài học.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [lessonId, supabase, taskId])

    const activeTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed'), [tasks])

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Đang tải bài học...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8">
                <span className="text-5xl">😕</span>
                <p className="text-gray-500 font-bold text-center">{error}</p>
                <Link href="/child" className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-sm">
                    Về trang chủ
                </Link>
            </div>
        )
    }

    if (!taskId && !lessonId) {
        return (
            <div className="max-w-6xl mx-auto p-8 space-y-7">
                <div className="rounded-[2rem] bg-gradient-to-r from-purple-600 to-violet-500 p-7 text-white">
                    <p className="text-xs font-black uppercase tracking-widest text-purple-200">Bài học</p>
                    <h1 className="text-3xl font-black mt-2">Môn học lớp {grade}</h1>
                    <p className="text-purple-100 mt-2 font-medium">Chọn môn và chương để học, sau đó làm kiểm tra ở trang Kiểm tra.</p>
                </div>

                {activeTasks.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">Nhiệm vụ được giao</h2>
                            <span className="text-xs font-black text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{activeTasks.length} nhiệm vụ</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {activeTasks.map((task) => (
                                <div key={task.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                                    <p className="text-xs font-black text-purple-500 uppercase tracking-widest">Task</p>
                                    <h3 className="text-lg font-black text-gray-800 mt-1 line-clamp-1">{task.lessons?.title ?? 'Bài học'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.lessons?.description ?? 'Bé mở bài học này để làm kiểm tra.'}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                                        <div className="rounded-xl bg-gray-50 py-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Trang</p>
                                            <p className="text-sm font-black text-gray-800">{task.start_page}-{task.end_page}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 py-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Pomodoro</p>
                                            <p className="text-sm font-black text-gray-800">{task.session_duration_minutes}p</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/child/lesson?taskId=${task.id}`}
                                        className="mt-4 inline-flex w-full justify-center py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black"
                                    >
                                        Mở bài học
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <h2 className="text-xl font-black text-gray-800">Danh sách môn và chương</h2>
                    {subjects.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-purple-200 p-8 text-center text-gray-500 font-bold">
                            Chưa có môn học cho lớp {grade}.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subjects.map((subject) => {
                                const lessons = lessonsBySubject[subject.id] ?? []
                                return (
                                    <div key={subject.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-black text-gray-800">{subject.name}</p>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lessons.length} chương / bài</p>
                                            </div>
                                            <Link
                                                href={`/child/quiz?subjectId=${subject.id}`}
                                                className="px-4 py-2 rounded-xl bg-purple-50 text-purple-600 text-xs font-black hover:bg-purple-100"
                                            >
                                                Kiểm tra môn này
                                            </Link>
                                        </div>

                                        {lessons.length === 0 ? (
                                            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400 font-semibold text-center">
                                                Chưa có bài học cho môn này.
                                            </div>
                                        ) : (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {lessons.map((lesson, idx) => (
                                                    <div key={lesson.id} className="rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-black text-gray-700 truncate">Chương {idx + 1}: {lesson.title}</p>
                                                            <span className="text-[10px] font-black text-gray-500">{lesson.total_pages} trang</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{lesson.description}</p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Link
                                                                href={`/child/lesson?id=${lesson.id}`}
                                                                className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-gray-600 font-black text-xs hover:bg-white"
                                                            >
                                                                Học bài
                                                            </Link>
                                                            <Link
                                                                href={`/child/quiz?lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`}
                                                                className="flex-1 text-center py-2 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700"
                                                            >
                                                                Làm kiểm tra
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

    if (!detailLesson) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <p className="text-gray-400 font-bold">Không tìm thấy bài học.</p>
            </div>
        )
    }

    const isTaskCompleted = detailSource === 'task' && detailTask?.status === 'completed'

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/child/lesson" className="p-2.5 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-purple-500">Chi tiết bài học</p>
                    <h1 className="text-2xl font-black text-gray-800 truncate">{detailLesson.title}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="w-full rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-100 p-5">
                        <p className="text-sm font-bold text-gray-600">{detailLesson.description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Tổng trang</p>
                            <p className="text-lg font-black text-gray-800">{detailLesson.total_pages}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Câu hỏi</p>
                            <p className="text-lg font-black text-gray-800">{quizCount}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Môn</p>
                            <p className="text-sm font-black text-gray-800 line-clamp-1">{detailLesson.subjects?.name ?? 'Tổng hợp'}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Lớp</p>
                            <p className="text-lg font-black text-gray-800">{detailLesson.subjects?.grade ?? '-'}</p>
                        </div>
                    </div>

                    {detailLesson.pdf_url && (
                        <BookPdfViewer
                            pdfUrl={detailLesson.pdf_url}
                            title={detailLesson.title}
                            startPage={detailSource === 'task' ? detailTask?.start_page ?? 1 : 1}
                            endPage={detailSource === 'task' ? detailTask?.end_page : undefined}
                            totalPages={detailLesson.total_pages}
                        />
                    )}
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Kiểm tra</p>

                    {detailSource === 'task' && detailTask && (
                        <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
                            <p className="text-xs font-black text-purple-500 uppercase tracking-widest">Session</p>
                            <p className="text-sm font-bold text-purple-800 mt-1">Trang {detailTask.start_page} - {detailTask.end_page}</p>
                            <p className="text-xs text-purple-500 mt-1">Pomodoro: {detailTask.session_duration_minutes} phút</p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-gray-100 p-4">
                        <p className="text-sm font-bold text-gray-700">Sẵn sàng làm kiểm tra?</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {detailSource === 'task'
                                ? 'Kết quả sẽ được lưu vào backend để hoàn thành nhiệm vụ và tạo phần thưởng.'
                                : 'Chế độ tự học: làm bài luyện tập theo dữ liệu thật của môn học.'}
                        </p>
                    </div>

                    <Link
                        href={
                            detailSource === 'task' && detailTask
                                ? `/child/quiz?taskId=${detailTask.id}&lessonId=${detailLesson.id}&lessonTitle=${encodeURIComponent(detailLesson.title)}&duration=${detailTask.session_duration_minutes}`
                                : `/child/quiz?lessonId=${detailLesson.id}&lessonTitle=${encodeURIComponent(detailLesson.title)}`
                        }
                        className={cn(
                            'w-full inline-flex justify-center py-3.5 rounded-2xl font-black text-sm transition-all',
                            quizCount > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-400 pointer-events-none'
                        )}
                    >
                        {isTaskCompleted ? 'Làm lại kiểm tra' : 'Bắt đầu kiểm tra'}
                    </Link>

                    {quizCount === 0 && <p className="text-xs font-bold text-red-400 text-center">Bài học này chưa có câu hỏi để kiểm tra.</p>}
                </div>
            </div>
        </div>
    )
}

export default function ChildLessonPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <LessonContent />
        </Suspense>
    )
}
