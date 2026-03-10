'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
    AcademicCapIcon,
    CheckCircleIcon,
    GiftIcon,
    SparklesIcon,
    StarIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'

interface ChildProfile {
    id: string
    full_name: string | null
    email: string | null
}

const tasks = [
    { id: '1', title: 'Đánh răng buổi sáng', detail: 'Hoàn thành lúc 07:30', point: '+10đ', done: true },
    { id: '2', title: 'Học tiếng Anh (App)', detail: 'Dự kiến: 15 phút', point: '+50đ', done: false },
    { id: '3', title: 'Dọn dẹp đồ chơi', detail: 'Dự kiến: 19:00', point: '+20đ', done: false },
]

const statCards = [
    { label: 'Điểm tích lũy', value: '1,250', icon: StarIcon, colorClass: 'border-emerald-200 bg-emerald-50/80 text-emerald-600' },
    { label: 'Hạng tuần', value: '#5', icon: TrophyIcon, colorClass: 'border-amber-200 bg-amber-50/80 text-amber-600' },
    { label: 'Nhiệm vụ xong', value: '8/10', icon: CheckCircleIcon, colorClass: 'border-purple-200 bg-purple-50/80 text-purple-600' },
]

export default function ParentDashboardPage() {
    const [selectedChild, setSelectedChild] = useState('')
    const [children, setChildren] = useState<ChildProfile[]>([])
    const [loadingChildren, setLoadingChildren] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchChildren() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setLoadingChildren(false)
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('parent_id', user.id)
                .eq('role', 'child')

            const fetchedChildren = (data as ChildProfile[] | null) ?? []
            setChildren(fetchedChildren)

            if (fetchedChildren.length > 0) {
                setSelectedChild((prev) => prev || fetchedChildren[0].id)
            }

            setLoadingChildren(false)
        }

        fetchChildren()
    }, [supabase])

    const getInitials = (name: string | null) => {
        if (!name) return 'BE'
        const words = name
            .trim()
            .split(/\s+/)
            .filter(Boolean)

        if (words.length === 0) return 'BE'
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }

    return (
        <div className="space-y-6 rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
            <section className="rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Đang xem cho:</span>

                    {loadingChildren ? (
                        <span className="text-sm font-medium text-slate-500">Đang tải danh sách bé...</span>
                    ) : children.length === 0 ? (
                        <span className="text-sm font-medium text-slate-500">Chưa có hồ sơ bé nào.</span>
                    ) : children.map((child) => {
                        const isActive = selectedChild === child.id
                        return (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() => setSelectedChild(child.id)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                                    isActive
                                        ? 'border-blue-500 bg-blue-500 text-white shadow'
                                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-blue-600">
                                    {getInitials(child.full_name)}
                                </span>
                                {child.full_name || 'Chưa đặt tên'}
                            </button>
                        )
                    })}

                    <Link
                        href="/parent/children/create"
                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                    >
                        <span className="text-base leading-none">+</span>
                        Thêm bé mới
                    </Link>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <article
                        key={card.label}
                        className={`rounded-3xl border px-5 py-4 shadow-sm ${card.colorClass}`}
                    >
                        <p className="text-sm font-semibold">{card.label}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <card.icon className="h-5 w-5" />
                            <p className="text-3xl font-black text-slate-900">{card.value}</p>
                        </div>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <article className="xl:col-span-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-2xl font-extrabold text-slate-900">Nhiệm vụ hôm nay</h3>
                        <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            Xem tất cả
                        </button>
                    </div>

                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                                            task.done ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}
                                    >
                                        {task.done ? (
                                            <CheckCircleIcon className="h-5 w-5" />
                                        ) : (
                                            <AcademicCapIcon className="h-5 w-5" />
                                        )}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-800">{task.title}</p>
                                        <p className="text-sm text-slate-500">{task.detail}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-indigo-500">{task.point}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="xl:col-span-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <h3 className="mb-5 text-2xl font-extrabold text-slate-900">Thành tích & Quà</h3>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-5 text-white">
                            <div className="flex items-center gap-2 text-sm font-semibold text-pink-100">
                                <SparklesIcon className="h-4 w-4" />
                                Siêu nhân tự giác
                            </div>
                            <p className="mt-3 text-xs text-pink-50">Còn 2 ngày nữa</p>
                            <div className="mt-2 h-2 rounded-full bg-white/30">
                                <div className="h-2 w-2/3 rounded-full bg-white" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 text-orange-500">
                                    <GiftIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">1 cây kem</p>
                                    <p className="text-sm text-slate-500">Đổi với 200đ</p>
                                </div>
                            </div>
                            <button type="button" className="mt-3 text-sm font-bold text-orange-600 hover:text-orange-700">
                                Đổi ngay
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-700">Tiến độ tuần này</p>
                            <p className="mt-1 text-sm text-slate-500">Minh Quang đang làm tốt hơn 15% so với tuần trước.</p>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    )
}
