'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    AcademicCapIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    FireIcon,
    StarIcon,
    TrophyIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'
import { api, MiniGameParentStats, Task } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ChildProfile {
    id: string
    full_name: string | null
    grade: number | null
    xp: number | null
}

interface ParentStats {
    children: Array<{ id: string; full_name: string | null }>
    totalSessions: number
    avgFocusMinutes: number
    avgQuizScore: number
}

interface ChildReport {
    id: string
    name: string
    grade: number | null
    xp: number
    tasks: Task[]
    miniGame?: MiniGameParentStats['byChild'][number]
}

type TimeRange = '7days' | '30days' | 'all'

function todayKey() {
    return new Date().toLocaleDateString('en-CA')
}

function getDateKey(value?: string | null) {
    return value?.slice(0, 10) ?? null
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return 'B'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function getStatusInfo(status: Task['status']) {
    switch (status) {
        case 'completed':
            return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
        case 'in_progress':
            return { label: 'Đang học', color: 'bg-blue-100 text-blue-700 border-blue-200' }
        default:
            return { label: 'Chưa làm', color: 'bg-slate-100 text-slate-600 border-slate-200' }
    }
}

function startDateForRange(range: TimeRange) {
    if (range === 'all') return null
    const date = new Date()
    date.setDate(date.getDate() - (range === '7days' ? 6 : 29))
    return date.toLocaleDateString('en-CA')
}

function taskInRange(task: Task, range: TimeRange) {
    const startDate = startDateForRange(range)
    if (!startDate) return true

    const assignedDate = getDateKey(task.assigned_date)
    if (!assignedDate) return true
    return assignedDate >= startDate && assignedDate <= todayKey()
}

function formatDate(value?: string | null) {
    const dateKey = getDateKey(value)
    if (!dateKey) return 'Chưa có ngày'
    return dateKey
}

function completionRate(tasks: Task[]) {
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter((task) => task.status === 'completed').length / tasks.length) * 100)
}

export default function ReportsPage() {
    const supabase = useMemo(() => createClient(), [])
    const [selectedChild, setSelectedChild] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<TimeRange>('7days')
    const [children, setChildren] = useState<ChildReport[]>([])
    const [stats, setStats] = useState<ParentStats | null>(null)
    const [miniGameStats, setMiniGameStats] = useState<MiniGameParentStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const [childrenResponse, sessionStats, gameStats] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, full_name, grade, xp')
                        .eq('parent_id', user.id)
                        .eq('role', 'child'),
                    api.sessions.stats(user.id),
                    api.miniGames.stats(user.id),
                ])

                const childProfiles = (childrenResponse.data as ChildProfile[] | null) ?? []
                const taskResponses = await Promise.allSettled(
                    childProfiles.map((child) => api.tasks.listForParentChild(child.id))
                )

                if (!isMounted) return

                setStats(sessionStats as ParentStats)
                setMiniGameStats(gameStats)
                setChildren(childProfiles.map((child, index) => ({
                    id: child.id,
                    name: child.full_name || 'Chưa đặt tên',
                    grade: child.grade,
                    xp: child.xp ?? 0,
                    tasks: taskResponses[index].status === 'fulfilled' ? taskResponses[index].value.data : [],
                    miniGame: gameStats.byChild?.find((item) => item.childId === child.id),
                })))
            } catch (error) {
                console.error('Error loading reports:', error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [supabase])

    const visibleChildren = useMemo(() => {
        return children.map((child) => ({
            ...child,
            tasks: child.tasks.filter((task) => taskInRange(task, timeRange)),
        }))
    }, [children, timeRange])

    const activeChild = selectedChild
        ? visibleChildren.find((child) => child.id === selectedChild)
        : null

    const allTasks = visibleChildren.flatMap((child) => child.tasks)
    const completedTasks = allTasks.filter((task) => task.status === 'completed').length
    const overallStats = {
        totalSessions: stats?.totalSessions ?? 0,
        avgFocusMinutes: stats?.avgFocusMinutes ?? 0,
        avgQuizScore: stats?.avgQuizScore ?? 0,
        totalChildren: children.length,
        taskCompletion: allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Báo cáo tiến độ</h2>
                    <p className="mt-1 text-sm text-slate-600">Theo dõi từ hồ sơ, task, session và mini game thật của hệ thống.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(['7days', '30days', 'all'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                                timeRange === range
                                    ? 'bg-blue-500 text-white shadow'
                                    : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                            )}
                        >
                            {range === '7days' ? '7 ngày' : range === '30days' ? '30 ngày' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <SummaryCard icon={AcademicCapIcon} label="Tổng buổi học" value={overallStats.totalSessions.toString()} accent="border-blue-200 bg-blue-50/80 text-blue-600" />
                <SummaryCard icon={ClockIcon} label="TB tập trung" value={`${overallStats.avgFocusMinutes} phút`} accent="border-emerald-200 bg-emerald-50/80 text-emerald-600" />
                <SummaryCard icon={TrophyIcon} label="TB điểm quiz" value={`${overallStats.avgQuizScore}%`} accent="border-amber-200 bg-amber-50/80 text-amber-600" />
                <SummaryCard icon={CheckCircleIcon} label="Hoàn thành task" value={`${overallStats.taskCompletion}%`} accent="border-indigo-200 bg-indigo-50/80 text-indigo-600" />
                <SummaryCard icon={UserGroupIcon} label="Số bé" value={overallStats.totalChildren.toString()} accent="border-purple-200 bg-purple-50/80 text-purple-600" />
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Xem theo bé:</span>
                    <button
                        onClick={() => setSelectedChild(null)}
                        className={cn(
                            'rounded-full px-4 py-2 text-sm font-semibold transition',
                            !selectedChild ? 'bg-blue-500 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                        )}
                    >
                        Tất cả
                    </button>
                    {visibleChildren.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChild(child.id)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                                selectedChild === child.id ? 'bg-blue-500 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                            )}
                        >
                            <span className={cn(
                                'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                                selectedChild === child.id ? 'bg-white/90 text-blue-600' : 'bg-blue-100 text-blue-600'
                            )}>
                                {getInitials(child.name)}
                            </span>
                            {child.name}
                        </button>
                    ))}
                </div>
            </div>

            {!selectedChild ? (
                visibleChildren.length === 0 ? (
                    <EmptyState message="Chưa có hồ sơ bé nào để báo cáo." />
                ) : (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {visibleChildren.map((child) => (
                            <ChildOverviewCard key={child.id} child={child} onSelect={setSelectedChild} />
                        ))}
                    </div>
                )
            ) : activeChild ? (
                <ChildDetailView child={activeChild} miniGameStats={miniGameStats} />
            ) : (
                <EmptyState message="Không tìm thấy dữ liệu của bé đang chọn." />
            )}
        </div>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    value: string
    accent: string
}) {
    return (
        <div className={cn('rounded-2xl border-2 px-5 py-4 shadow-sm', accent)}>
            <p className="text-sm font-semibold">{label}</p>
            <div className="mt-2 flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <p className="text-3xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    )
}

function ChildOverviewCard({ child, onSelect }: { child: ChildReport; onSelect: (id: string) => void }) {
    const rate = completionRate(child.tasks)
    const completed = child.tasks.filter((task) => task.status === 'completed').length
    const currentStreak = child.miniGame?.currentStreak ?? 0

    return (
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-md transition hover:shadow-lg">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-bold text-blue-600">
                        {getInitials(child.name)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                        <p className="text-sm text-slate-500">{child.grade ? `Lớp ${child.grade}` : 'Chưa gán lớp'} · {child.xp} XP</p>
                    </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    {rate}% task
                </span>
            </div>

            <div className="mb-5 grid grid-cols-4 gap-3">
                <MiniStat icon={AcademicCapIcon} value={child.tasks.length.toString()} label="Task" color="text-blue-600" />
                <MiniStat icon={CheckCircleIcon} value={completed.toString()} label="Đã xong" color="text-emerald-600" />
                <MiniStat icon={StarIcon} value={(child.miniGame?.totalStars ?? 0).toString()} label="Sao game" color="text-amber-600" />
                <MiniStat icon={FireIcon} value={currentStreak.toString()} label="Streak" color="text-orange-500" />
            </div>

            <div className="mb-5">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">Hoàn thành bài tập</span>
                    <span className="font-bold text-blue-600">{completed}/{child.tasks.length}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all" style={{ width: `${rate}%` }} />
                </div>
            </div>

            <button onClick={() => onSelect(child.id)} className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow transition hover:bg-blue-600">
                Xem chi tiết →
            </button>
        </div>
    )
}

function MiniStat({
    icon: Icon,
    value,
    label,
    color,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    value: string
    label: string
    color: string
}) {
    return (
        <div className="text-center">
            <div className={cn('flex items-center justify-center gap-1', color)}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-bold">{value}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
        </div>
    )
}

function ChildDetailView({ child, miniGameStats }: { child: ChildReport; miniGameStats: MiniGameParentStats | null }) {
    const rate = completionRate(child.tasks)
    const completed = child.tasks.filter((task) => task.status === 'completed').length
    const recentTasks = child.tasks.slice().sort((a, b) => (getDateKey(b.assigned_date) ?? '').localeCompare(getDateKey(a.assigned_date) ?? '')).slice(0, 8)

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-black text-white shadow-lg">
                        {getInitials(child.name)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900">{child.name}</h3>
                        <p className="text-sm text-slate-600">{child.grade ? `Lớp ${child.grade}` : 'Chưa gán lớp'} · {child.xp.toLocaleString()} XP</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Dữ liệu thật
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <StatCard label="Task" value={child.tasks.length.toString()} icon={AcademicCapIcon} accent="border-blue-200 bg-blue-50 text-blue-600" />
                <StatCard label="Đã xong" value={completed.toString()} icon={CheckCircleIcon} accent="border-emerald-200 bg-emerald-50 text-emerald-600" />
                <StatCard label="Tiến độ" value={`${rate}%`} icon={TrophyIcon} accent="border-amber-200 bg-amber-50 text-amber-600" />
                <StatCard label="Streak game" value={`${child.miniGame?.currentStreak ?? 0} ngày`} icon={FireIcon} accent="border-orange-200 bg-orange-50 text-orange-500" />
                <StatCard label="Sao game" value={(child.miniGame?.totalStars ?? 0).toString()} icon={StarIcon} accent="border-purple-200 bg-purple-50 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md xl:col-span-3">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                        Tiến độ bài tập
                    </h4>
                    <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeLinecap="round" strokeDasharray={`${rate}, 100`} strokeWidth="3" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-black text-slate-900">{rate}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{completed}/{child.tasks.length}</p>
                            <p className="text-sm text-slate-500">bài đã hoàn thành trong khoảng đang chọn</p>
                            <p className="mt-2 text-sm text-slate-500">Mini game toàn hệ thống: {miniGameStats?.totalPlays ?? 0} lượt, {miniGameStats?.avgAccuracy ?? 0}% chính xác.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md xl:col-span-2">
                    <h4 className="mb-3 text-lg font-bold text-slate-900">Nhận xét nhanh</h4>
                    <ul className="space-y-2.5 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            <span className="text-slate-700">{rate >= 80 ? 'Bé hoàn thành phần lớn bài được giao.' : 'Bé còn bài chưa hoàn thành, phụ huynh nên nhắc nhẹ theo từng phiên ngắn.'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                            <span className="text-slate-700">Focus/quiz chi tiết theo từng bé cần backend bổ sung endpoint session theo child.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md">
                <h4 className="mb-4 text-lg font-bold text-slate-900">Bài tập gần đây</h4>
                {recentTasks.length === 0 ? (
                    <EmptyState message="Chưa có bài tập trong khoảng đang chọn." />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Bài học</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Trạng thái</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Thời lượng</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Ngày giao</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTasks.map((task) => {
                                    const statusInfo = getStatusInfo(task.status)
                                    return (
                                        <tr key={task.id} className="border-b border-slate-100 last:border-0">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{task.lessons?.title || 'Bài học'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusInfo.color)}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{task.session_duration_minutes} phút</td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(task.assigned_date)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string
    value: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    accent: string
}) {
    return (
        <div className={cn('rounded-2xl border-2 px-4 py-3 shadow-sm', accent)}>
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <p className="text-xl font-black text-slate-900">{value}</p>
            </div>
            <p className="mt-0.5 text-xs font-semibold">{label}</p>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center text-sm font-semibold text-slate-500">
            {message}
        </div>
    )
}
