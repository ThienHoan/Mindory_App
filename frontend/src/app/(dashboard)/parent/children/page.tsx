'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { ChildCard } from '@/components/dashboard/child-card'
import Link from 'next/link'

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    role: 'parent' | 'child'
    grade: number | null
}

type FilterType = 'all' | 'learning' | 'need-reminder' | 'completed'
type SortType = 'points-desc' | 'points-asc' | 'name-asc' | 'name-desc'

export default function ChildrenPage() {
    const [children, setChildren] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [sort, setSort] = useState<SortType>('name-asc')
    const supabase = createClient()

    useEffect(() => {
        async function fetchChildren() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('parent_id', user.id)

            if (data) setChildren(data as Profile[])
            setLoading(false)
        }

        fetchChildren()
    }, [])

    // Mock data để demo - sau này nối API thật
    const enrichedChildren = children.map((child, idx) => ({
        ...child,
        points: Math.floor(Math.random() * 2000) + 500,
        streak: Math.floor(Math.random() * 15),
        rank: `#${idx + 1}`,
        status: (['idle', 'learning', 'completed', 'need-reminder'] as const)[idx % 4],
        badge: idx === 0 ? 'Siêu sao' : idx === 1 ? 'Top tuần' : undefined,
    }))

    // Lọc
    const filteredChildren = enrichedChildren.filter((child) => {
        if (filter === 'all') return true
        return child.status === filter
    })

    // Sắp xếp
    const sortedChildren = [...filteredChildren].sort((a, b) => {
        switch (sort) {
            case 'points-desc':
                return b.points - a.points
            case 'points-asc':
                return a.points - b.points
            case 'name-asc':
                return (a.full_name || '').localeCompare(b.full_name || '')
            case 'name-desc':
                return (b.full_name || '').localeCompare(a.full_name || '')
            default:
                return 0
        }
    })

    const filterOptions = [
        { value: 'all' as const, label: 'Tất cả', count: enrichedChildren.length },
        { value: 'learning' as const, label: 'Đang học', count: enrichedChildren.filter(c => c.status === 'learning').length },
        { value: 'completed' as const, label: 'Hoàn thành', count: enrichedChildren.filter(c => c.status === 'completed').length },
        { value: 'need-reminder' as const, label: 'Cần nhắc', count: enrichedChildren.filter(c => c.status === 'need-reminder').length },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Quản Lý Hồ Sơ Trẻ
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        {enrichedChildren.length} bé · {enrichedChildren.filter(c => c.status === 'completed').length} hoàn thành hôm nay
                    </p>
                </div>
                <Link
                    href="/parent/children/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    Thêm Hồ Sơ Mới
                </Link>
            </div>

            {/* Filters & Sort */}
            {enrichedChildren.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    {/* Filter tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-slate-400" />
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                    filter === option.value
                                        ? 'bg-blue-500 text-white shadow'
                                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                                }`}
                            >
                                {option.label} ({option.count})
                            </button>
                        ))}
                    </div>

                    {/* Sort dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-600">Sắp xếp:</label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortType)}
                            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="name-asc">Tên A → Z</option>
                            <option value="name-desc">Tên Z → A</option>
                            <option value="points-desc">Điểm cao → thấp</option>
                            <option value="points-asc">Điểm thấp → cao</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Children Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        <p className="mt-3 text-sm font-medium text-slate-600">Đang tải danh sách...</p>
                    </div>
                </div>
            ) : sortedChildren.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 p-4 text-blue-600">
                        <PlusIcon className="h-full w-full" />
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-700">
                        {filter === 'all' ? 'Chưa có hồ sơ trẻ nào được tạo' : 'Không có bé nào trong danh mục này'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        {filter === 'all' && 'Bấm "Thêm Hồ Sơ Mới" để bắt đầu.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedChildren.map((child) => (
                        <ChildCard
                            key={child.id}
                            id={child.id}
                            name={child.full_name || 'Chưa đặt tên'}
                            email={child.email || ''}
                            grade={child.grade ?? 1}
                            points={child.points}
                            streak={child.streak}
                            rank={child.rank}
                            status={child.status}
                            badge={child.badge}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
