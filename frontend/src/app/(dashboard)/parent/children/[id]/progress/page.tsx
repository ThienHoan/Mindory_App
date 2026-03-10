'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ChildProgressPage() {
    const params = useParams()
    const router = useRouter()
    const childId = params.id as string

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Quay lại
                </button>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Tiến Độ Học Tập
                </h2>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-md">
                <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 p-4 text-emerald-600">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900">Biểu Đồ Tiến Độ</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Trang này sẽ hiển thị biểu đồ học tập theo tuần/tháng, thống kê thời gian tập trung, điểm quiz
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Child ID: {childId}</p>
                </div>
            </div>
        </div>
    )
}
