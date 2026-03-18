'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ArrowUpTrayIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { GRADES, SUBJECTS } from '@/lib/constants/subjects'
import { MOCK_LESSONS } from '@/lib/constants/lessons'

interface Subject {
    id: string
    name: string
}

interface Lesson {
    id: string
    subjectId: string
    grade: number
    title: string
    description: string | null
    totalPages: number
}

interface ChildProfile {
    id: string
    full_name: string
    email: string
    grade: number
}

const MOCK_CHILDREN: ChildProfile[] = [
    { id: 'child-01', full_name: 'Nguyen Minh An', email: 'an.parent.demo@example.com', grade: 2 },
    { id: 'child-02', full_name: 'Tran Bao Nhi', email: 'nhi.parent.demo@example.com', grade: 4 },
    { id: 'child-03', full_name: 'Le Gia Huy', email: 'huy.parent.demo@example.com', grade: 1 },
]

const SUBJECT_SWATCH: Record<string, string> = {
    math: 'from-sky-500 to-blue-600',
    vietnamese: 'from-fuchsia-500 to-pink-500',
    science: 'from-emerald-500 to-green-600',
    history: 'from-amber-500 to-orange-500',
    geography: 'from-cyan-500 to-teal-500',
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
    const preSelectedChildId = searchParams.get('childId')

    const [children] = useState<ChildProfile[]>(MOCK_CHILDREN)
    const [subjects] = useState<Subject[]>(SUBJECTS)
    const [lessons] = useState<Lesson[]>(MOCK_LESSONS)

    const [selectedChildren, setSelectedChildren] = useState<string[]>(preSelectedChildId ? [preSelectedChildId] : [])
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [selectedLessonId, setSelectedLessonId] = useState<string>('')
    const [searchText, setSearchText] = useState('')
    const [sessionDuration, setSessionDuration] = useState(20)
    const [sessionsPerDay, setSessionsPerDay] = useState(2)
    const [scheduleDate, setScheduleDate] = useState(formatDateInputValue(new Date()))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const gradeLessons = useMemo(
        () => (selectedGrade ? lessons.filter((lesson) => lesson.grade === selectedGrade) : []),
        [lessons, selectedGrade]
    )

    const availableSubjects = useMemo(() => {
        const ids = new Set(gradeLessons.map((lesson) => lesson.subjectId))
        return subjects.filter((subject) => ids.has(subject.id))
    }, [gradeLessons, subjects])

    const filteredLessons = useMemo(() => {
        const bySubject = selectedSubject
            ? gradeLessons.filter((lesson) => lesson.subjectId === selectedSubject)
            : gradeLessons

        if (!searchText.trim()) return bySubject

        const normalizedSearch = searchText.trim().toLowerCase()
        return bySubject.filter((lesson) => {
            const haystack = `${lesson.title} ${lesson.description ?? ''}`.toLowerCase()
            return haystack.includes(normalizedSearch)
        })
    }, [gradeLessons, searchText, selectedSubject])

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || null
    const selectedSubjectName = selectedLesson
        ? subjects.find((subject) => subject.id === selectedLesson.subjectId)?.name || 'Môn học'
        : 'Chưa chọn'

    const selectedChildrenInfo = children.filter((child) => selectedChildren.includes(child.id))
    const estimateMinutes = sessionDuration * sessionsPerDay
    const estimatePoints = selectedLesson ? selectedLesson.totalPages * 40 : 0

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

        setIsSubmitting(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setIsSubmitting(false)
        setIsSuccess(true)
    }

    const handleReset = () => {
        setSelectedGrade(null)
        setSelectedSubject('')
        setSelectedLessonId('')
        setSearchText('')
        setSelectedChildren(preSelectedChildId ? [preSelectedChildId] : [])
        setSessionDuration(20)
        setSessionsPerDay(2)
        setScheduleDate(formatDateInputValue(new Date()))
        setIsSuccess(false)
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {isSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-emerald-700">
                            Đã giao bài thành công cho {selectedChildren.length} bé. Bạn có thể tiếp tục giao thêm bài khác.
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
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Create New Exercise</h2>
                        <p className="mt-1 text-sm text-slate-500">Upload hoặc chọn bài từ thư viện, không cần kết nối database.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.push('/parent')}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                        >
                            {isSubmitting ? 'Đang tạo...' : 'Create Exercise'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">1. Upload PDF Content</h3>
                        <p className="text-xs text-slate-500">Kéo thả file hoặc bấm để chọn. Đây là giao diện demo nên không upload thật.</p>
                        <div className="mt-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                <ArrowUpTrayIcon className="h-6 w-6" />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-700">Drag and drop your PDF here</p>
                            <p className="text-xs text-slate-500">Hoặc bấm Browse Files (max 10MB)</p>
                            <button
                                type="button"
                                className="mt-4 rounded-lg bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700"
                            >
                                Browse Files
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">2. Choose from Library</h3>
                        <p className="text-xs text-slate-500">Chọn lớp trước, sau đó mới chọn môn theo đúng luồng bạn yêu cầu.</p>

                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search library..."
                                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Grades</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {GRADES.map((grade) => (
                                    <button
                                        key={grade.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGrade(grade.id)
                                            setSelectedSubject('')
                                            setSelectedLessonId('')
                                        }}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                            selectedGrade === grade.id
                                                ? 'border-violet-500 bg-violet-500 text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-violet-300'
                                        )}
                                    >
                                        {grade.name}
                                    </button>
                                ))}
                            </div>

                            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Subjects</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {availableSubjects.length === 0 && (
                                    <span className="text-xs font-medium text-slate-500">Chọn lớp để hiện môn học</span>
                                )}
                                {availableSubjects.map((subject) => (
                                    <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSubject(subject.id)
                                            setSelectedLessonId('')
                                        }}
                                        disabled={!selectedGrade}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                            selectedSubject === subject.id
                                                ? 'border-violet-500 bg-violet-500 text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-violet-300',
                                            !selectedGrade && 'cursor-not-allowed opacity-60'
                                        )}
                                    >
                                        {subject.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredLessons.map((lesson) => {
                                const subjectName = subjects.find((subject) => subject.id === lesson.subjectId)?.name || 'Môn học'
                                const isActive = selectedLessonId === lesson.id
                                return (
                                    <button
                                        key={lesson.id}
                                        type="button"
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className={cn(
                                            'overflow-hidden rounded-2xl border text-left transition hover:shadow-md',
                                            isActive
                                                ? 'border-violet-500 ring-2 ring-violet-200'
                                                : 'border-slate-200 bg-white hover:border-violet-300'
                                        )}
                                    >
                                        <div className={cn('h-20 bg-gradient-to-br', SUBJECT_SWATCH[lesson.subjectId] || 'from-slate-400 to-slate-500')} />
                                        <div className="space-y-1 p-3">
                                            <p className="line-clamp-2 text-sm font-bold text-slate-900">{lesson.title}</p>
                                            <p className="text-[11px] text-slate-500">{subjectName}</p>
                                            <p className="text-[11px] text-slate-400">Grade {lesson.grade}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {selectedGrade && filteredLessons.length === 0 && (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
                                Không tìm thấy bài phù hợp với bộ lọc hiện tại.
                            </div>
                        )}

                        {!selectedGrade && (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
                                Bắt đầu bằng cách chọn lớp 1 đến lớp 5.
                            </div>
                        )}
                    </div>
                </section>

                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Exercise Summary</h3>

                    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-500">Selected Item</p>
                        {selectedLesson ? (
                            <>
                                <p className="mt-2 text-sm font-bold text-slate-900">{selectedLesson.title}</p>
                                <p className="text-xs text-slate-500">{selectedSubjectName} · Grade {selectedLesson.grade}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg border border-violet-200 bg-white p-2">
                                        <p className="text-slate-500">Estimate Time</p>
                                        <p className="font-bold text-slate-900">{estimateMinutes} mins</p>
                                    </div>
                                    <div className="rounded-lg border border-violet-200 bg-white p-2">
                                        <p className="text-slate-500">Points Reward</p>
                                        <p className="font-bold text-amber-600">+{estimatePoints} XP</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="mt-2 text-xs font-medium text-slate-500">Chưa chọn bài học.</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Assign to Children</p>
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
                                            <p className="text-sm font-semibold text-slate-800">{child.full_name}</p>
                                            <p className="text-[11px] text-slate-500">Lớp {child.grade}</p>
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
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Schedule Start</label>
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
                                    <option value={10}>10 phút</option>
                                    <option value={20}>20 phút</option>
                                    <option value={30}>30 phút</option>
                                </select>
                            </div>
                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-slate-500">Số phiên/ngày</p>
                                <select
                                    value={sessionsPerDay}
                                    onChange={(event) => setSessionsPerDay(Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Đang giao bài...' : 'Assign Now'}
                        {!isSubmitting && <CheckCircleIcon className="h-4 w-4" />}
                    </button>

                    <p className="mt-2 text-center text-xs text-slate-400">
                        Demo UI only · Không kết nối database
                    </p>

                    {selectedChildrenInfo.length > 0 && (
                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Đã chọn: {selectedChildrenInfo.map((child) => child.full_name).join(', ')}
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
