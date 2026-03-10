'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ChildSettingsPage() {
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
                    Cài Đặt Hồ Sơ
                </h2>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-md">
                <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 p-4 text-purple-600">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900">Trang Cài Đặt</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Trang này sẽ cho phép sửa thông tin bé, đổi mật khẩu, cài đặt giới hạn thời gian học
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Child ID: {childId}</p>
                </div>
            </div>
        </div>
    )
}
