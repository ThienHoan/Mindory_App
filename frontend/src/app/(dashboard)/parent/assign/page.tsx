'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [children, setChildren] = useState<any[]>([])

    // Form State
    const [selectedChild, setSelectedChild] = useState<string>('')
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
            const res = await fetch('http://localhost:4000/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childId: selectedChild,
                    lessonId: selectedLesson,
                    parentId: (await supabase.auth.getUser()).data.user?.id, // Ensure parentId is sent
                    ...config
                })
            })

            if (!res.ok) throw new Error('Failed to assign task')

            router.push('/parent')
            router.refresh()
        } catch (error) {
            alert('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Chọn bé để giao bài</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {children.map(child => (
                    <div
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={cn(
                            "cursor-pointer rounded-lg border p-4 hover:border-indigo-500",
                            selectedChild === child.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200"
                        )}
                    >
                        <p className="font-medium text-gray-900">{child.full_name}</p>
                        <p className="text-sm text-gray-500">{child.email}</p>
                    </div>
                ))}
                {children.length === 0 && <p>Chưa có hồ sơ bé nào.</p>}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Chọn bài học</h3>
            <div className="grid grid-cols-1 gap-4">
                {MOCK_LESSONS.map(lesson => (
                    <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson.id)}
                        className={cn(
                            "cursor-pointer rounded-lg border p-4 hover:border-indigo-500 flex justify-between items-center",
                            selectedLesson === lesson.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200"
                        )}
                    >
                        <div>
                            <p className="font-medium text-gray-900">{lesson.title}</p>
                            <p className="text-sm text-gray-500">{lesson.description}</p>
                        </div>
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {lesson.totalPages} trang
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Cấu hình phiên học</h3>

            <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Thời gian mỗi phiên (phút)</label>
                <select
                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={config.sessionDuration}
                    onChange={(e) => setConfig({ ...config, sessionDuration: Number(e.target.value) })}
                >
                    <option value={5}>5 phút</option>
                    <option value={15}>15 phút</option>
                    <option value={25}>25 phút</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Số phiên mỗi ngày</label>
                <select
                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={config.sessionsPerDay}
                    onChange={(e) => setConfig({ ...config, sessionsPerDay: Number(e.target.value) })}
                >
                    <option value={1}>1 phiên</option>
                    <option value={2}>2 phiên</option>
                    <option value={3}>3 phiên</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Trang bắt đầu</label>
                    <input
                        type="number"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                        value={config.startPage}
                        onChange={(e) => setConfig({ ...config, startPage: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Trang kết thúc</label>
                    <input
                        type="number"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                        value={config.endPage}
                        onChange={(e) => setConfig({ ...config, endPage: Number(e.target.value) })}
                    />
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Giao Bài Tập Mới</h2>
                {/* Progress Bar */}
                <div className="mt-4 flex items-center justify-between">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full font-semibold",
                                currentStep >= step.id ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                            )}>
                                {step.id}
                            </div>
                            <span className={cn(
                                "ml-2 text-sm font-medium",
                                currentStep >= step.id ? "text-indigo-600" : "text-gray-500"
                            )}>{step.name}</span>
                            {idx < STEPS.length - 1 && (
                                <ChevronRightIcon className="mx-4 h-5 w-5 text-gray-300" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <div className="mt-8 flex justify-between border-t border-gray-100 pt-6">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="rounded-md px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Quay lại
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={(currentStep === 1 && !selectedChild) || (currentStep === 2 && !selectedLesson)}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            Tiếp tục
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Hoàn thành'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
