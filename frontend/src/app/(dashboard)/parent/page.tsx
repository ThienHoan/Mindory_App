'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
    AcademicCapIcon,
    CheckCircleIcon,
    FireIcon,
    GiftIcon,
    SparklesIcon,
    StarIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { api, MiniGameParentStats, RewardItem, RewardRedemption, Task } from '@/lib/api-client'

interface ChildProfile {
    id: string
    full_name: string | null
    email: string | null
}

interface ParentStats {
    children: Array<{ id: string; full_name: string | null }>
    totalSessions: number
    avgFocusMinutes: number
    avgQuizScore: number
}

function todayKey() {
    return new Date().toLocaleDateString('en-CA')
}

function taskDateKey(task: Task) {
    return task.assigned_date?.slice(0, 10) ?? null
}

function isDueForDashboard(task: Task) {
    const assignedDate = taskDateKey(task)
    return !assignedDate || assignedDate <= todayKey()
}

function formatTaskMeta(task: Task) {
    const assignedDate = taskDateKey(task)
    const dateText = !assignedDate
        ? 'Chưa có ngày giao'
        : assignedDate === todayKey()
            ? 'Giao hôm nay'
            : `Giao ngày ${assignedDate}`

    return `${dateText} · ${task.session_duration_minutes} phút · ${task.sessions_per_day ?? 1} phiên/ngày`
}

function getTaskStatusLabel(status: Task['status']) {
    if (status === 'completed') return 'Xong'
    if (status === 'in_progress') return 'Đang học'
    return 'Đang chờ'
}

export default function ParentDashboardPage() {
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    const [selectedChild, setSelectedChild] = useState('')
    const [children, setChildren] = useState<ChildProfile[]>([])
    const [stats, setStats] = useState<ParentStats | null>(null)
    const [miniGameStats, setMiniGameStats] = useState<MiniGameParentStats | null>(null)
    const [selectedChildTasks, setSelectedChildTasks] = useState<Task[]>([])
    const [rewardItems, setRewardItems] = useState<RewardItem[]>([])
    const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
    const [loading, setLoading] = useState(true)
    const [tasksLoading, setTasksLoading] = useState(false)

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    if (isMounted) setLoading(false)
                    return
                }

                const [statsData, miniStatsData, childrenResponse, rewardItemsData, redemptionsData] = await Promise.all([
                    api.sessions.stats(user.id),
                    api.miniGames.stats(user.id),
                    supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .eq('parent_id', user.id)
                        .eq('role', 'child'),
                    api.rewards.listStore({ parentId: user.id }),
                    api.rewards.listRedemptions({ parentId: user.id }),
                ])

                if (!isMounted) return

                const fetchedChildren = (childrenResponse.data as ChildProfile[] | null) ?? []
                setStats(statsData as ParentStats)
                setMiniGameStats(miniStatsData)
                setChildren(fetchedChildren)
                setRewardItems(rewardItemsData.filter((item) => item.is_active))
                setRedemptions(redemptionsData)

                if (fetchedChildren.length > 0) {
                    setSelectedChild(fetchedChildren[0].id)
                }
            } catch (error) {
                console.error('Error loading parent dashboard:', error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [supabase])

    useEffect(() => {
        let isMounted = true

        async function loadSelectedChildTasks() {
            if (!selectedChild) {
                setSelectedChildTasks([])
                return
            }

            setTasksLoading(true)
            try {
                const response = await api.tasks.listForParentChild(selectedChild)
                if (isMounted) setSelectedChildTasks(response.data)
            } catch (error) {
                console.error('Error loading child tasks:', error)
                if (isMounted) setSelectedChildTasks([])
            } finally {
                if (isMounted) setTasksLoading(false)
            }
        }

        loadSelectedChildTasks()

        return () => {
            isMounted = false
        }
    }, [selectedChild])

    const selectedChildName = useMemo(() => {
        return children.find((child) => child.id === selectedChild)?.full_name || 'Chưa chọn bé'
    }, [children, selectedChild])

    const visibleTasks = selectedChildTasks.filter(isDueForDashboard)
    const completedVisibleTasks = visibleTasks.filter((task) => task.status === 'completed').length
    const nextRewardItem = rewardItems.slice().sort((a, b) => a.cost_points - b.cost_points)[0]
    const pendingRedemptions = redemptions.filter((redemption) => redemption.status === 'requested')

    const statCards = [
        {
            label: 'Điểm mini game',
            value: `${miniGameStats?.totalStars ?? 0}`,
            icon: StarIcon,
            colorClass: 'border-emerald-200 bg-emerald-50/80 text-emerald-600',
        },
        {
            label: 'Chuỗi mini game',
            value: `${miniGameStats?.currentStreak ?? 0} ngày`,
            icon: FireIcon,
            colorClass: 'border-amber-200 bg-amber-50/80 text-amber-600',
        },
        {
            label: 'Nhiệm vụ cần làm',
            value: `${completedVisibleTasks}/${visibleTasks.length}`,
            icon: CheckCircleIcon,
            colorClass: 'border-sky-200 bg-sky-50/80 text-sky-600',
        },
        {
            label: 'Độ chính xác game',
            value: `${miniGameStats?.avgAccuracy ?? 0}%`,
            icon: TrophyIcon,
            colorClass: 'border-violet-200 bg-violet-50/80 text-violet-600',
        },
    ]

    const handleCreateAITask = () => {
        if (!selectedChild) {
            alert('Vui lòng chọn bé trước khi tạo bài tập bằng AI.')
            return
        }
        router.push(`/parent/pdf-quiz?childId=${selectedChild}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    <p className="text-sm font-bold text-gray-400">Đang tải số liệu...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">Parent Dashboard</h2>
                    <p className="mt-1 text-sm text-slate-500">Đang xem dữ liệu của: {selectedChildName}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCreateAITask}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                    >
                        <SparklesIcon className="h-5 w-5" />
                        Tạo bài bằng AI
                    </button>
                    <Link
                        href="/parent/assign"
                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        Giao bài mới +
                    </Link>
                </div>
            </div>

            <section className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-indigo-50 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Đang xem cho:</span>
                    {children.length === 0 ? (
                        <span className="text-sm font-medium text-slate-500">Chưa có hồ sơ bé nào.</span>
                    ) : (
                        children.map((child) => {
                            const isActive = selectedChild === child.id
                            return (
                                <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => setSelectedChild(child.id)}
                                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                                        isActive
                                            ? 'border-blue-500 bg-blue-500 text-white shadow'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                    }`}
                                >
                                    {child.full_name || 'Chưa đặt tên'}
                                </button>
                            )
                        })
                    )}

                    <Link
                        href="/parent/children/create"
                        className="rounded-full border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                    >
                        + Thêm bé mới
                    </Link>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {statCards.map((card) => (
                    <article key={card.label} className={`rounded-3xl border px-5 py-4 shadow-sm ${card.colorClass}`}>
                        <p className="text-sm font-semibold">{card.label}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <card.icon className="h-5 w-5" />
                            <p className="text-3xl font-black text-slate-900">{card.value}</p>
                        </div>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 xl:col-span-3">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-2xl font-extrabold text-slate-900">Nhiệm vụ cần làm</h3>
                        <Link href="/parent/reports" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            Xem báo cáo
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {tasksLoading ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                                Đang tải nhiệm vụ...
                            </div>
                        ) : visibleTasks.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                                <p className="text-sm font-bold text-slate-700">Chưa có nhiệm vụ cần làm hôm nay.</p>
                                <p className="mt-1 text-xs text-slate-500">Bài giao cho ngày tương lai sẽ không hiện ở đây.</p>
                            </div>
                        ) : (
                            visibleTasks.slice(0, 6).map((task) => {
                                const done = task.status === 'completed'
                                return (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                                                    done ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                }`}
                                            >
                                                {done ? <CheckCircleIcon className="h-5 w-5" /> : <AcademicCapIcon className="h-5 w-5" />}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-slate-800">{task.lessons?.title || 'Bài học'}</p>
                                                <p className="text-sm text-slate-500">{formatTaskMeta(task)}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-500">{getTaskStatusLabel(task.status)}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </article>

                <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 xl:col-span-2">
                    <h3 className="mb-5 text-2xl font-extrabold text-slate-900">Thành tích và quà</h3>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-5 text-white">
                            <div className="flex items-center gap-2 text-sm font-semibold text-pink-100">
                                <SparklesIcon className="h-4 w-4" />
                                Tiến độ nhiệm vụ
                            </div>
                            <p className="mt-3 text-xs text-pink-50">Tính từ bài thật đã giao cho bé đang chọn</p>
                            <div className="mt-2 h-2 rounded-full bg-white/30">
                                <div
                                    className="h-2 rounded-full bg-white"
                                    style={{ width: `${visibleTasks.length ? Math.round((completedVisibleTasks / visibleTasks.length) * 100) : 0}%` }}
                                />
                            </div>
                            <p className="mt-3 text-sm font-bold">
                                {completedVisibleTasks}/{visibleTasks.length} nhiệm vụ cần làm đã hoàn thành
                            </p>
                        </div>

                        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 text-orange-500">
                                    <GiftIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{nextRewardItem?.title ?? 'Chưa có quà trong kho'}</p>
                                    <p className="text-sm text-slate-500">
                                        {nextRewardItem ? `Đổi với ${nextRewardItem.cost_points} XP` : 'Tạo quà trong mục Reward để bé có mục tiêu rõ ràng.'}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm font-bold text-orange-600">
                                {pendingRedemptions.length > 0 ? `${pendingRedemptions.length} yêu cầu chờ duyệt` : 'Chưa có yêu cầu đổi quà'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-700">Tiến độ học tập</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Tổng phiên học: {stats?.totalSessions ?? 0}, tập trung trung bình: {stats?.avgFocusMinutes ?? 0} phút, điểm quiz: {stats?.avgQuizScore ?? 0}%.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Mini game: {miniGameStats?.totalPlays ?? 0} lượt, {Math.round((miniGameStats?.totalDurationSeconds ?? 0) / 60)} phút chơi.
                            </p>
                            {miniGameStats?.byGame?.[0] && (
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                    Game chơi nhiều nhất: <span className="text-slate-700">{miniGameStats.byGame[0].gameId}</span> ({miniGameStats.byGame[0].plays} lượt)
                                </p>
                            )}
                        </div>
                    </div>
                </article>
            </section>

            <section className="space-y-4">
                <h3 className="text-xl font-black text-gray-800">Danh sách các con</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
                        >
                            <div>
                                <p className="font-black text-gray-800">{child.full_name || 'Chưa đặt tên'}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Learner</p>
                            </div>
                            <Link href={`/parent/assign?childId=${child.id}`} className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-600">
                                GIAO BÀI
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
