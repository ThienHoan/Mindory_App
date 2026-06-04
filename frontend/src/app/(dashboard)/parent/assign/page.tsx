'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api-client'
import {
    DEFAULT_SESSION_DURATION,
    DEFAULT_SESSIONS_PER_DAY,
    SESSION_DURATION_OPTIONS,
    SESSIONS_PER_DAY_OPTIONS,
} from '@/lib/constants/session-options'
import { cn } from '@/lib/utils'

interface ChildProfile {
    id: string
    full_name: string | null
    email: string | null
    grade?: number | null
}

interface LessonItem {
    id: string
    subject_id: string
    title: string
    description: string
    total_pages: number
}

function formatDateInputValue(value: Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function AssignTaskContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()

    const preSelectedChildId = searchParams.get('childId')

    const [children, setChildren] = useState<ChildProfile[]>([])
    const [lessons, setLessons] = useState<LessonItem[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const [selectedChildren, setSelectedChildren] = useState<string[]>(preSelectedChildId ? [preSelectedChildId] : [])
    const [selectedLessonId, setSelectedLessonId] = useState<string>('')
    const [searchText, setSearchText] = useState('')
    const [sessionDuration, setSessionDuration] = useState(DEFAULT_SESSION_DURATION)
    const [sessionsPerDay, setSessionsPerDay] = useState(DEFAULT_SESSIONS_PER_DAY)
    const [startPage, setStartPage] = useState(1)
    const [endPage, setEndPage] = useState(1)
    const [scheduleDate, setScheduleDate] = useState(formatDateInputValue(new Date()))

    useEffect(() => {
        let isMounted = true

        async function fetchData() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    if (isMounted) setLoadingData(false)
                    return
                }

                const [childrenResponse, lessonsResponse] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, full_name, email, grade')
                        .eq('parent_id', user.id)
                        .eq('role', 'child'),
                    api.lessons.list(),
                ])

                if (!isMounted) return

                setChildren((childrenResponse.data as ChildProfile[] | null) ?? [])

                const normalizedLessons = (lessonsResponse.data ?? []).map((lesson) => ({
                    id: lesson.id,
                    subject_id: lesson.subject_id,
                    title: lesson.title,
                    description: lesson.description,
                    total_pages: lesson.total_pages,
                }))

                setLessons(normalizedLessons)
            } catch (error) {
                console.error('Error fetching assign page data:', error)
            } finally {
                if (isMounted) setLoadingData(false)
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, [supabase])

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || null

    useEffect(() => {
        if (!selectedLesson) {
            setStartPage(1)
            setEndPage(1)
            return
        }

        setStartPage(1)
        setEndPage(Math.min(3, selectedLesson.total_pages || 1))
    }, [selectedLesson])

    const filteredLessons = useMemo(() => {
        if (!searchText.trim()) return lessons
        const keyword = searchText.trim().toLowerCase()
        return lessons.filter((lesson) => {
            const haystack = `${lesson.title} ${lesson.description}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [lessons, searchText])

    const selectedChildrenInfo = useMemo(
        () => children.filter((child) => selectedChildren.includes(child.id)),
        [children, selectedChildren]
    )

    const estimateMinutes = sessionDuration * sessionsPerDay
    const estimatePoints = selectedLesson ? selectedLesson.total_pages * 40 : 0

    const handleToggleChild = (childId: string) => {
        setSelectedChildren((prev) => {
            if (prev.includes(childId)) {
                return prev.filter((id) => id !== childId)
            }
            return [...prev, childId]
        })
    }

    const handleSubmit = async () => {
        if (!selectedLessonId) {
            alert('Vui lòng chọn bài học trước khi giao bài.')
            return
        }

        if (selectedChildren.length === 0) {
            alert('Vui lòng chọn ít nhất một bé để giao bài.')
            return
        }

        if (startPage > endPage) {
            alert('Trang bắt đầu phải nhỏ hơn hoặc bằng trang kết thúc.')
            return
        }

        if (!scheduleDate) {
            alert('Vui lòng chọn ngày giao bài.')
            return
        }

        setIsSubmitting(true)

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Unauthorized')
            }

            await Promise.all(
                selectedChildren.map((childId) =>
                    api.tasks.create({
                        childId,
                        lessonId: selectedLessonId,
                        parentId: user.id,
                        sessionDuration,
                        sessionsPerDay,
                        assignedDate: scheduleDate,
                        // TODO: Add parent-facing controlled game break setting after product UX is finalized.
                        startPage,
                        endPage,
                    })
                )
            )

            setIsSuccess(true)
            router.refresh()
        } catch (error) {
            console.error('Error assigning task:', error)
            alert('Có lỗi xảy ra khi giao bài. Vui lòng thử lại.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setSelectedLessonId('')
        setSearchText('')
        setSelectedChildren(preSelectedChildId ? [preSelectedChildId] : [])
        setSessionDuration(DEFAULT_SESSION_DURATION)
        setSessionsPerDay(DEFAULT_SESSIONS_PER_DAY)
        setScheduleDate(formatDateInputValue(new Date()))
        setStartPage(1)
        setEndPage(1)
        setIsSuccess(false)
    }

    if (loadingData) {
        return (
            <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                Đang tải dữ liệu giao bài...
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {isSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-emerald-700">
                            Đã giao bài thành công cho {selectedChildren.length} bé.
                        </p>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700"
                        >
                            Giao bài mới
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Giao Bài Tập Mới</h2>
                        <p className="mt-1 text-sm text-slate-500">Chọn bài học và giao cho một hoặc nhiều bé.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.push('/parent')}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Quay lại
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                        >
                            {isSubmitting ? 'Đang giao...' : 'Giao bài ngay'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">Chọn bài từ thư viện</h3>
                        <p className="text-xs text-slate-500">Tìm kiếm và chọn bài học để giao.</p>

                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Tìm bài học..."
                                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredLessons.map((lesson) => {
                                const isActive = selectedLessonId === lesson.id
                                return (
                                    <button
                                        key={lesson.id}
                                        type="button"
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className={cn(
                                            'rounded-2xl border p-4 text-left transition hover:shadow-md',
                                            isActive
                                                ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                                                : 'border-slate-200 bg-white hover:border-violet-300'
                                        )}
                                    >
                                        <p className="line-clamp-2 text-sm font-bold text-slate-900">{lesson.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{lesson.description}</p>
                                        <p className="mt-2 text-[11px] font-semibold text-slate-400">{lesson.total_pages} trang</p>
                                    </button>
                                )
                            })}
                        </div>

                        {filteredLessons.length === 0 && (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
                                Không tìm thấy bài học phù hợp.
                            </div>
                        )}
                    </div>
                </section>

                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tóm tắt bài giao</h3>

                    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-500">Bài đã chọn</p>
                        {selectedLesson ? (
                            <>
                                <p className="mt-2 text-sm font-bold text-slate-900">{selectedLesson.title}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg border border-violet-200 bg-white p-2">
                                        <p className="text-slate-500">Tổng thời gian ước tính</p>
                                        <p className="font-bold text-slate-900">{estimateMinutes} phút</p>
                                    </div>
                                    <div className="rounded-lg border border-violet-200 bg-white p-2">
                                        <p className="text-slate-500">XP dự kiến</p>
                                        <p className="font-bold text-amber-600">+{estimatePoints} XP</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="mt-2 text-xs font-medium text-slate-500">Chưa chọn bài học.</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Giao cho bé</p>
                        {children.length === 0 && <p className="text-xs text-slate-500">Chưa có hồ sơ bé nào.</p>}
                        {children.map((child) => {
                            const checked = selectedChildren.includes(child.id)
                            return (
                                <label
                                    key={child.id}
                                    className={cn(
                                        'flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition',
                                        checked ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-200'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                            <UserIcon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{child.full_name || 'Chưa đặt tên'}</p>
                                            <p className="text-[11px] text-slate-500">{child.email || 'Không có email'}</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleChild(child.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                    />
                                </label>
                            )
                        })}
                    </div>

                    <div className="mt-4 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Ngày giao</label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                            <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={(event) => setScheduleDate(event.target.value)}
                                className="w-full text-sm font-semibold text-slate-700 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-slate-500">Mỗi phiên</p>
                                <select
                                    value={sessionDuration}
                                    onChange={(event) => setSessionDuration(Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
                                >
                                    {SESSION_DURATION_OPTIONS.map((duration) => (
                                        <option key={duration} value={duration}>
                                            {duration} phút
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-slate-500">Số phiên/ngày</p>
                                <select
                                    value={sessionsPerDay}
                                    onChange={(event) => setSessionsPerDay(Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
                                >
                                    {SESSIONS_PER_DAY_OPTIONS.map((count) => (
                                        <option key={count} value={count}>
                                            {count}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-xs font-bold text-amber-700">Game giải lao</p>
                            <p className="mt-1 text-xs leading-5 text-amber-700">
                                Game giải lao ngắn giúp bé reset, hệ thống sẽ tự kéo bé quay lại bài.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-slate-500">Trang bắt đầu</p>
                                <input
                                    type="number"
                                    min={1}
                                    value={startPage}
                                    onChange={(event) => setStartPage(Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-slate-500">Trang kết thúc</p>
                                <input
                                    type="number"
                                    min={1}
                                    value={endPage}
                                    onChange={(event) => setEndPage(Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Đang giao bài...' : 'Giao bài ngay'}
                        {!isSubmitting && <CheckCircleIcon className="h-4 w-4" />}
                    </button>

                    {selectedChildrenInfo.length > 0 && (
                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Đã chọn: {selectedChildrenInfo.map((child) => child.full_name || 'Chưa đặt tên').join(', ')}
                        </p>
                    )}
                </aside>
            </div>
        </div>
    )
}

export default function AssignTaskPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                    Đang tải trang giao bài...
                </div>
            }
        >
            <AssignTaskContent />
        </Suspense>
    )
}
