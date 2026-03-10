'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { MOCK_LESSONS } from '@/lib/constants/lessons'

const STEPS = [
    { id: 1, name: 'Chọn Bé' },
    { id: 2, name: 'Chọn Bài Học' },
    { id: 3, name: 'Thiết Lập' },
]

export default function AssignTaskPage() {
    const searchParams = useSearchParams()
    const preSelectedChildId = searchParams.get('childId')
    
    const [currentStep, setCurrentStep] = useState(preSelectedChildId ? 2 : 1)
    const [loading, setLoading] = useState(false)
    const [children, setChildren] = useState<any[]>([])
    const [showSuccess, setShowSuccess] = useState(false)

    // Form State
    const [selectedChild, setSelectedChild] = useState<string>(preSelectedChildId || '')
    const [selectedLesson, setSelectedLesson] = useState<string>('')
    const [config, setConfig] = useState({
        sessionDuration: 15,
        sessionsPerDay: 3,
        startPage: 1,
        endPage: 3
    })

    const router = useRouter()
    const supabase = createClient()

    // Fetch Children
    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('parent_id', user.id)
                if (data) setChildren(data)
            }
        }
        fetchData()
    }, [supabase])

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(c => c + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Bạn cần đăng nhập')

            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childId: selectedChild,
                    lessonId: selectedLesson,
                    sessionDuration: config.sessionDuration,
                    sessionsPerDay: config.sessionsPerDay,
                    startPage: config.startPage,
                    endPage: config.endPage,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to assign task')
            }

            // Show success notification
            setShowSuccess(true)
        } catch (error: any) {
            alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại')
            console.error('Assign task error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignAnother = () => {
        setShowSuccess(false)
        setCurrentStep(1)
        setSelectedChild('')
        setSelectedLesson('')
        setConfig({
            sessionDuration: 15,
            sessionsPerDay: 3,
            startPage: 1,
            endPage: 3
        })
    }

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-5">
            <div>
                <h3 className="text-xl font-bold text-slate-900">Chọn bé để giao bài</h3>
                <p className="mt-1 text-sm text-slate-500">Chọn con bạn muốn giao bài tập</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {children.map(child => (
                    <div
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={cn(
                            "group cursor-pointer rounded-2xl border-2 p-5 transition-all hover:shadow-lg",
                            selectedChild === child.id 
                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md" 
                                : "border-slate-200 bg-white hover:border-blue-300"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition",
                                selectedChild === child.id 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                            )}>
                                {child.full_name?.charAt(0)?.toUpperCase() || 'B'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate font-bold text-slate-900">{child.full_name}</p>
                                <p className="truncate text-sm text-slate-500">{child.email}</p>
                            </div>
                            {selectedChild === child.id && (
                                <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-blue-500" />
                            )}
                        </div>
                    </div>
                ))}
                {children.length === 0 && (
                    <div className="col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="text-slate-600">Chưa có hồ sơ bé nào.</p>
                    </div>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-5">
            <div>
                <h3 className="text-xl font-bold text-slate-900">Chọn bài học</h3>
                <p className="mt-1 text-sm text-slate-500">Chọn nội dung học tập cho bé</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {MOCK_LESSONS.map(lesson => (
                    <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson.id)}
                        className={cn(
                            "group cursor-pointer rounded-2xl border-2 p-5 transition-all hover:shadow-lg",
                            selectedLesson === lesson.id 
                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md" 
                                : "border-slate-200 bg-white hover:border-blue-300"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900">{lesson.title}</p>
                                    {selectedLesson === lesson.id && (
                                        <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{lesson.description}</p>
                            </div>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold",
                                selectedLesson === lesson.id 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-600"
                            )}>
                                {lesson.totalPages} trang
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-slate-900">Cấu hình phiên học</h3>
                <p className="mt-1 text-sm text-slate-500">Thiết lập thời gian và phạm vi học tập</p>
            </div>

            <div className="space-y-5">
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-bold text-slate-900">⏱️ Thời gian mỗi phiên (phút)</label>
                    <select
                        className="mt-2 block w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={config.sessionDuration}
                        onChange={(e) => setConfig({ ...config, sessionDuration: Number(e.target.value) })}
                    >
                        <option value={5}>5 phút</option>
                        <option value={15}>15 phút</option>
                        <option value={25}>25 phút</option>
                    </select>
                </div>

                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-bold text-slate-900">📅 Số phiên mỗi ngày</label>
                    <select
                        className="mt-2 block w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={config.sessionsPerDay}
                        onChange={(e) => setConfig({ ...config, sessionsPerDay: Number(e.target.value) })}
                    >
                        <option value={1}>1 phiên</option>
                        <option value={2}>2 phiên</option>
                        <option value={3}>3 phiên</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                        <label className="block text-sm font-bold text-slate-900">📖 Trang bắt đầu</label>
                        <input
                            type="number"
                            className="mt-2 block w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            value={config.startPage}
                            onChange={(e) => setConfig({ ...config, startPage: Number(e.target.value) })}
                            min={1}
                        />
                    </div>
                    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                        <label className="block text-sm font-bold text-slate-900">📗 Trang kết thúc</label>
                        <input
                            type="number"
                            className="mt-2 block w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            value={config.endPage}
                            onChange={(e) => setConfig({ ...config, endPage: Number(e.target.value) })}
                            min={config.startPage}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Success Notification */}
            {showSuccess && (
                <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-8 shadow-lg">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                            <CheckCircleIcon className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="mt-4 text-2xl font-black text-emerald-900">🎉 Giao Bài Thành Công!</h3>
                        <p className="mt-2 text-emerald-700">
                            Bài tập đã được giao cho <span className="font-bold">
                                {children.find(c => c.id === selectedChild)?.full_name}
                            </span>
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <button
                                onClick={() => router.push('/parent')}
                                className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-white px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
                            >
                                ← Quay về trang chủ
                            </button>
                            <button
                                onClick={handleAssignAnother}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600"
                            >
                                + Giao thêm bài tập
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            {!showSuccess && (
                <>
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">🎯 Giao Bài Tập Mới</h2>
                <p className="mt-2 text-sm text-slate-600">Tạo nhiệm vụ học tập cho bé theo 3 bước đơn giản</p>
                
                {/* Progress Steps */}
                <div className="mt-6 flex items-center justify-between">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex flex-1 items-center">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-md transition-all",
                                    currentStep >= step.id 
                                        ? "bg-blue-500 text-white ring-4 ring-blue-100" 
                                        : "bg-white text-slate-400 ring-2 ring-slate-200"
                                )}>
                                    {currentStep > step.id ? (
                                        <CheckCircleIcon className="h-6 w-6" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <div className="hidden sm:block">
                                    <p className={cn(
                                        "text-sm font-bold",
                                        currentStep >= step.id ? "text-blue-600" : "text-slate-400"
                                    )}>{step.name}</p>
                                </div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={cn(
                                    "mx-2 h-1 flex-1 rounded-full transition-all",
                                    currentStep > step.id ? "bg-blue-500" : "bg-slate-200"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-lg">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Action Buttons */}
                <div className="mt-8 flex items-center justify-between border-t-2 border-slate-100 pt-6">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ← Quay lại
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={(currentStep === 1 && !selectedChild) || (currentStep === 2 && !selectedLesson)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Tiếp tục →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-emerald-600 hover:to-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>✓ Hoàn thành</>
                            )}
                        </button>
                    )}
                </div>
            </div>
                </>
            )}
        </div>
    )
}
