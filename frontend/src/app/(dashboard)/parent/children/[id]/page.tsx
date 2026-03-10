'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ChildDetailPage() {
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
                    Chi Tiết Hồ Sơ Bé
                </h2>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-md">
                <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 p-4 text-blue-600">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900">Trang Chi Tiết</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Trang này sẽ hiển thị thông tin chi tiết về bé: lịch sử học tập, thành tích, báo cáo tổng quan
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Child ID: {childId}</p>
                </div>
            </div>
        </div>
    )
}
