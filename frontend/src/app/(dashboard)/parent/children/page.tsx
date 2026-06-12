'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { ChildCard } from '@/components/dashboard/child-card'
import Link from 'next/link'
import { api, type MiniGameParentStats, type Task } from '@/lib/api-client'

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    role: 'parent' | 'child'
    grade: number | null
    xp: number | null
}

type FilterType = 'all' | 'learning' | 'need-reminder' | 'completed'
type SortType = 'points-desc' | 'points-asc' | 'name-asc' | 'name-desc'
type ChildStatus = 'idle' | 'learning' | 'need-reminder' | 'completed'

interface ChildInsight {
    points: number
    streak: number
    rank: string
    status: ChildStatus
    badge?: string
}

const copy = {
    badges: {
        leader: 'D\u1eabn \u0111\u1ea7u',
        streak: 'Gi\u1eef l\u1eeda',
        learning: 'Ch\u0103m ch\u1ec9',
    },
    filters: {
        all: 'T\u1ea5t c\u1ea3',
        learning: '\u0110ang h\u1ecdc',
        completed: 'Ho\u00e0n th\u00e0nh',
        reminder: 'C\u1ea7n nh\u1eafc',
    },
    title: 'Qu\u1ea3n L\u00fd H\u1ed3 S\u01a1 Tr\u1ebb',
    summaryLabel: 'b\u00e9 \u00b7',
    summaryCompleted: 'b\u00e9 ho\u00e0n th\u00e0nh nhi\u1ec7m v\u1ee5 hi\u1ec7n t\u1ea1i',
    addChild: 'Th\u00eam H\u1ed3 S\u01a1 M\u1edbi',
    sort: 'S\u1eafp x\u1ebfp:',
    sortNameAsc: 'T\u00ean A \u2192 Z',
    sortNameDesc: 'T\u00ean Z \u2192 A',
    sortPointsDesc: '\u0110i\u1ec3m cao \u2192 th\u1ea5p',
    sortPointsAsc: '\u0110i\u1ec3m th\u1ea5p \u2192 cao',
    loading: '\u0110ang t\u1ea3i danh s\u00e1ch...',
    emptyAll: 'Ch\u01b0a c\u00f3 h\u1ed3 s\u01a1 tr\u1ebb n\u00e0o \u0111\u01b0\u1ee3c t\u1ea1o',
    emptyFiltered: 'Kh\u00f4ng c\u00f3 b\u00e9 n\u00e0o trong danh m\u1ee5c n\u00e0y',
    emptyHint: 'B\u1ea5m "Th\u00eam H\u1ed3 S\u01a1 M\u1edbi" \u0111\u1ec3 b\u1eaft \u0111\u1ea7u.',
    unnamed: 'Ch\u01b0a \u0111\u1eb7t t\u00ean',
} as const

function todayKey() {
    return new Date().toLocaleDateString('en-CA')
}

function taskDateKey(task: Task) {
    return task.assigned_date?.slice(0, 10) ?? null
}

function isCurrentTask(task: Task) {
    const assignedDate = taskDateKey(task)
    return !assignedDate || assignedDate <= todayKey()
}

function deriveChildStatus(tasks: Task[]): ChildStatus {
    const currentTasks = tasks.filter(isCurrentTask)

    if (currentTasks.some((task) => task.status === 'in_progress')) return 'learning'
    if (currentTasks.some((task) => task.status === 'pending')) return 'need-reminder'
    if (currentTasks.some((task) => task.status === 'completed')) return 'completed'
    if (tasks.some((task) => task.status === 'completed')) return 'completed'

    return 'idle'
}

export default function ChildrenPage() {
    const [children, setChildren] = useState<Profile[]>([])
    const [childInsights, setChildInsights] = useState<Record<string, ChildInsight>>({})
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [sort, setSort] = useState<SortType>('name-asc')
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        let isMounted = true

        async function fetchChildren() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    if (isMounted) setLoading(false)
                    return
                }

                const [childrenResponse, miniGameStats] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, full_name, email, role, grade, xp')
                        .eq('parent_id', user.id)
                        .eq('role', 'child'),
                    api.miniGames.stats(user.id).catch(() => null as MiniGameParentStats | null),
                ])

                const nextChildren = (childrenResponse.data as Profile[] | null) ?? []
                const taskPairs = await Promise.all(
                    nextChildren.map(async (child) => {
                        try {
                            const response = await api.tasks.listForParentChild(child.id)
                            return [child.id, response.data] as const
                        } catch {
                            return [child.id, [] as Task[]] as const
                        }
                    })
                )

                if (!isMounted) return

                const tasksByChild = new Map(taskPairs)
                const miniGameStatsByChild = new Map((miniGameStats?.byChild ?? []).map((entry) => [entry.childId, entry]))

                const rankedChildren = [...nextChildren].sort((left, right) => {
                    const xpDiff = (right.xp ?? 0) - (left.xp ?? 0)
                    if (xpDiff !== 0) return xpDiff

                    const streakDiff =
                        (miniGameStatsByChild.get(right.id)?.currentStreak ?? 0) -
                        (miniGameStatsByChild.get(left.id)?.currentStreak ?? 0)
                    if (streakDiff !== 0) return streakDiff

                    return (left.full_name || '').localeCompare(right.full_name || '')
                })

                const rankByChild = new Map(rankedChildren.map((child, index) => [child.id, index + 1]))
                const nextInsights: Record<string, ChildInsight> = {}

                for (const child of nextChildren) {
                    const tasks = tasksByChild.get(child.id) ?? []
                    const points = Math.max(0, child.xp ?? 0)
                    const streak = miniGameStatsByChild.get(child.id)?.currentStreak ?? 0
                    const rankNumber = rankByChild.get(child.id) ?? nextChildren.length
                    const status = deriveChildStatus(tasks)

                    let badge: string | undefined
                    if (rankNumber === 1 && points > 0) badge = copy.badges.leader
                    else if (streak >= 3) badge = copy.badges.streak
                    else if (status === 'learning') badge = copy.badges.learning

                    nextInsights[child.id] = {
                        points,
                        streak,
                        rank: `#${rankNumber}`,
                        status,
                        badge,
                    }
                }

                setChildren(nextChildren)
                setChildInsights(nextInsights)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        void fetchChildren()

        return () => {
            isMounted = false
        }
    }, [supabase])

    const enrichedChildren = useMemo(
        () => children.map((child) => ({
            ...child,
            ...(childInsights[child.id] ?? {
                points: Math.max(0, child.xp ?? 0),
                streak: 0,
                rank: '--',
                status: 'idle' as ChildStatus,
                badge: undefined,
            }),
        })),
        [childInsights, children]
    )

    const filteredChildren = enrichedChildren.filter((child) => {
        if (filter === 'all') return true
        return child.status === filter
    })

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
        { value: 'all' as const, label: copy.filters.all, count: enrichedChildren.length },
        { value: 'learning' as const, label: copy.filters.learning, count: enrichedChildren.filter((child) => child.status === 'learning').length },
        { value: 'completed' as const, label: copy.filters.completed, count: enrichedChildren.filter((child) => child.status === 'completed').length },
        { value: 'need-reminder' as const, label: copy.filters.reminder, count: enrichedChildren.filter((child) => child.status === 'need-reminder').length },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">{copy.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        {enrichedChildren.length} {copy.summaryLabel} {enrichedChildren.filter((child) => child.status === 'completed').length} {copy.summaryCompleted}
                    </p>
                </div>
                <Link
                    href="/parent/children/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    {copy.addChild}
                </Link>
            </div>

            {enrichedChildren.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-600">{copy.sort}</label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortType)}
                            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="name-asc">{copy.sortNameAsc}</option>
                            <option value="name-desc">{copy.sortNameDesc}</option>
                            <option value="points-desc">{copy.sortPointsDesc}</option>
                            <option value="points-asc">{copy.sortPointsAsc}</option>
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        <p className="mt-3 text-sm font-medium text-slate-600">{copy.loading}</p>
                    </div>
                </div>
            ) : sortedChildren.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 p-4 text-blue-600">
                        <PlusIcon className="h-full w-full" />
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-700">
                        {filter === 'all' ? copy.emptyAll : copy.emptyFiltered}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{filter === 'all' ? copy.emptyHint : ''}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedChildren.map((child) => (
                        <ChildCard
                            key={child.id}
                            id={child.id}
                            name={child.full_name || copy.unnamed}
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