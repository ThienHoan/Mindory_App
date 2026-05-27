'use client'

import { useEffect, useState } from 'react'
import { AcademicCapIcon, BookOpenIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

async function fetchWithAuth(path: string, token: string) {
    const res = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return res.ok ? res.json() : null
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ subjects: 0, lessons: 0, quizzes: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token ?? ''

                const [subjectsRes, lessonsRes] = await Promise.all([
                    fetchWithAuth('/subjects/admin/list?limit=1', token),
                    fetchWithAuth('/lessons/admin/list?limit=1', token),
                ])

                setStats({
                    subjects: subjectsRes?.total ?? 0,
                    lessons: lessonsRes?.total ?? 0,
                    quizzes: 0, // quiz total requires lessonId filter
                })
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    const cards = [
        { label: 'Tổng môn học', value: stats.subjects, icon: AcademicCapIcon, color: 'bg-indigo-500' },
        { label: 'Tổng bài học', value: stats.lessons, icon: BookOpenIcon, color: 'bg-emerald-500' },
        { label: 'Tổng câu hỏi Quiz', value: stats.quizzes, icon: QuestionMarkCircleIcon, color: 'bg-amber-500' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tổng Quan Hệ Thống</h2>
                <p className="mt-1 text-sm text-gray-500">Quản lý toàn bộ nội dung học tập</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.label} className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className={`${card.color} rounded-lg p-3`}>
                                        <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                        <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <strong>⚠️ Lưu ý:</strong> Mọi thay đổi nội dung sẽ ảnh hưởng trực tiếp đến trải nghiệm học tập của trẻ.
                Hãy kiểm tra kỹ trước khi xóa bài học hoặc câu hỏi đang được sử dụng.
            </div>
        </div>
    )
}
