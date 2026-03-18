'use client'

import { useState } from 'react'
import {
    AcademicCapIcon,
    ClockIcon,
    CheckCircleIcon,
    FireIcon,
    TrophyIcon,
    StarIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarDaysIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

// ── Mock stats gắn cho từng bé thật ────────────────────
const MOCK_STATS_POOL = [
    {
        totalSessions: 28,
        avgFocusMinutes: 22,
        avgQuizScore: 85,
        streak: 7,
        totalPoints: 1450,
        tasksCompleted: 18,
        tasksTotal: 22,
        trend: 'up' as const,
        weeklyData: [
            { day: 'T2', minutes: 25, score: 80 },
            { day: 'T3', minutes: 30, score: 90 },
            { day: 'T4', minutes: 20, score: 75 },
            { day: 'T5', minutes: 35, score: 95 },
            { day: 'T6', minutes: 15, score: 70 },
            { day: 'T7', minutes: 40, score: 88 },
            { day: 'CN', minutes: 0, score: 0 },
        ],
        recentTasks: [
            { title: 'Phép cộng có nhớ', status: 'completed', score: 90, date: '11/03/2026' },
            { title: 'Phép trừ có nhớ', status: 'completed', score: 80, date: '10/03/2026' },
            { title: 'Nhân chia cơ bản', status: 'in_progress', score: null, date: '12/03/2026' },
            { title: 'Hình học phẳng', status: 'pending', score: null, date: '12/03/2026' },
        ],
    },
    {
        totalSessions: 15,
        avgFocusMinutes: 18,
        avgQuizScore: 72,
        streak: 3,
        totalPoints: 820,
        tasksCompleted: 10,
        tasksTotal: 16,
        trend: 'down' as const,
        weeklyData: [
            { day: 'T2', minutes: 20, score: 70 },
            { day: 'T3', minutes: 15, score: 65 },
            { day: 'T4', minutes: 25, score: 80 },
            { day: 'T5', minutes: 10, score: 60 },
            { day: 'T6', minutes: 20, score: 75 },
            { day: 'T7', minutes: 0, score: 0 },
            { day: 'CN', minutes: 0, score: 0 },
        ],
        recentTasks: [
            { title: 'Đọc hiểu văn bản', status: 'completed', score: 70, date: '11/03/2026' },
            { title: 'Tập viết chữ đẹp', status: 'completed', score: 75, date: '10/03/2026' },
            { title: 'Phép cộng cơ bản', status: 'pending', score: null, date: '12/03/2026' },
        ],
    },
]

type ChildReport = {
    id: string
    name: string
    avatar: string | null
    grade: number
    totalSessions: number
    avgFocusMinutes: number
    avgQuizScore: number
    streak: number
    totalPoints: number
    tasksCompleted: number
    tasksTotal: number
    trend: 'up' | 'down'
    weeklyData: { day: string; minutes: number; score: number }[]
    recentTasks: { title: string; status: string; score: number | null; date: string }[]
}

type TimeRange = '7days' | '30days' | 'all'

const MOCK_CHILDREN = [
    { id: 'child-01', name: 'Nguyen Minh An', grade: 2 },
    { id: 'child-02', name: 'Tran Bao Nhi', grade: 4 },
    { id: 'child-03', name: 'Le Gia Huy', grade: 1 },
]

// ── Helpers ────────────────────────────────────────────
function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return 'B'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-500'
}

function getScoreBg(score: number) {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
}

function getStatusInfo(status: string) {
    switch (status) {
        case 'completed':
            return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
        case 'in_progress':
            return { label: 'Đang học', color: 'bg-blue-100 text-blue-700 border-blue-200' }
        default:
            return { label: 'Chưa làm', color: 'bg-slate-100 text-slate-600 border-slate-200' }
    }
}

// ── Component ──────────────────────────────────────────
export default function ReportsPage() {
    const [selectedChild, setSelectedChild] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<TimeRange>('7days')
    const [children] = useState<ChildReport[]>(() =>
        MOCK_CHILDREN.map((child, idx) => ({
            ...child,
            avatar: null,
            ...MOCK_STATS_POOL[idx % MOCK_STATS_POOL.length],
        }))
    )

    const activeChild = selectedChild
        ? children.find((c) => c.id === selectedChild)
        : null

    const overallStats = {
        totalSessions: children.reduce((s, c) => s + c.totalSessions, 0),
        avgFocusMinutes: children.length ? Math.round(children.reduce((s, c) => s + c.avgFocusMinutes, 0) / children.length) : 0,
        avgQuizScore: children.length ? Math.round(children.reduce((s, c) => s + c.avgQuizScore, 0) / children.length) : 0,
        totalChildren: children.length,
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        📊 Báo Cáo Tiến Độ
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Theo dõi quá trình học tập và phát triển của các bé
                    </p>
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
                                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
                            )}
                        >
                            {range === '7days' ? '7 ngày' : range === '30days' ? '30 ngày' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Overall Summary Cards ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard
                    icon={AcademicCapIcon}
                    label="Tổng buổi học"
                    value={overallStats.totalSessions.toString()}
                    accent="border-blue-200 bg-blue-50/80 text-blue-600"
                />
                <SummaryCard
                    icon={ClockIcon}
                    label="TB thời gian tập trung"
                    value={`${overallStats.avgFocusMinutes} phút`}
                    accent="border-emerald-200 bg-emerald-50/80 text-emerald-600"
                />
                <SummaryCard
                    icon={TrophyIcon}
                    label="TB điểm quiz"
                    value={`${overallStats.avgQuizScore}%`}
                    accent="border-amber-200 bg-amber-50/80 text-amber-600"
                />
                <SummaryCard
                    icon={UserGroupIcon}
                    label="Số bé đang học"
                    value={overallStats.totalChildren.toString()}
                    accent="border-purple-200 bg-purple-50/80 text-purple-600"
                />
            </div>

            {/* ── Child Selector Tabs ── */}
            <div className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Xem theo bé:
                    </span>
                    <button
                        onClick={() => setSelectedChild(null)}
                        className={cn(
                            'rounded-full px-4 py-2 text-sm font-semibold transition',
                            !selectedChild
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                        )}
                    >
                        Tất cả
                    </button>
                    {children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChild(child.id)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                                selectedChild === child.id
                                    ? 'bg-blue-500 text-white shadow'
                                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                                    selectedChild === child.id
                                        ? 'bg-white/90 text-blue-600'
                                        : 'bg-blue-100 text-blue-600'
                                )}
                            >
                                {getInitials(child.name)}
                            </span>
                            {child.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            {!selectedChild ? (
                /* All-children overview */
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {children.map((child) => (
                        <ChildOverviewCard key={child.id} child={child} onSelect={setSelectedChild} />
                    ))}
                </div>
            ) : activeChild ? (
                /* Single child detail */
                <ChildDetailView child={activeChild} />
            ) : null}
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────

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

function ChildOverviewCard({
    child,
    onSelect,
}: {
    child: ChildReport
    onSelect: (id: string) => void
}) {
    const completionRate = Math.round((child.tasksCompleted / child.tasksTotal) * 100)

    return (
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-md transition hover:shadow-lg">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-bold text-blue-600">
                        {getInitials(child.name)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                        <p className="text-sm text-slate-500">Lớp {child.grade}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {child.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />
                    )}
                    <span
                        className={cn(
                            'text-xs font-bold',
                            child.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                        )}
                    >
                        {child.trend === 'up' ? 'Tiến bộ' : 'Cần cải thiện'}
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="mb-5 grid grid-cols-4 gap-3">
                <MiniStat icon={AcademicCapIcon} value={child.totalSessions.toString()} label="Buổi học" color="text-blue-600" />
                <MiniStat icon={ClockIcon} value={`${child.avgFocusMinutes}p`} label="TB tập trung" color="text-emerald-600" />
                <MiniStat icon={StarIcon} value={`${child.avgQuizScore}%`} label="TB quiz" color="text-amber-600" />
                <MiniStat icon={FireIcon} value={child.streak.toString()} label="Streak" color="text-orange-500" />
            </div>

            {/* Completion Progress */}
            <div className="mb-5">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">Hoàn thành bài tập</span>
                    <span className="font-bold text-blue-600">
                        {child.tasksCompleted}/{child.tasksTotal} ({completionRate}%)
                    </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* Weekly Bar Chart */}
            <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-slate-700">Thời gian học trong tuần (phút)</p>
                <div className="flex items-end gap-2">
                    {child.weeklyData.map((d) => (
                        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500">{d.minutes || ''}</span>
                            <div
                                className={cn(
                                    'w-full rounded-t-md transition-all',
                                    d.minutes > 0 ? 'bg-gradient-to-t from-blue-400 to-blue-300' : 'bg-slate-100'
                                )}
                                style={{ height: `${Math.max(d.minutes * 1.2, 4)}px` }}
                            />
                            <span className="text-[10px] font-medium text-slate-400">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* View Details Button */}
            <button
                onClick={() => onSelect(child.id)}
                className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow transition hover:bg-blue-600"
            >
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

function ChildDetailView({ child }: { child: ChildReport }) {
    const completionRate = Math.round((child.tasksCompleted / child.tasksTotal) * 100)

    return (
        <div className="space-y-5">
            {/* Child Info Banner */}
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-black text-white shadow-lg">
                        {getInitials(child.name)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900">{child.name}</h3>
                        <p className="text-sm text-slate-600">
                            Lớp {child.grade} · {child.totalPoints.toLocaleString()} điểm tích lũy
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {child.trend === 'up' ? (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                                Đang tiến bộ
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                                Cần cải thiện
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <StatCard label="Buổi học" value={child.totalSessions.toString()} icon={AcademicCapIcon} accent="border-blue-200 bg-blue-50 text-blue-600" />
                <StatCard label="TB tập trung" value={`${child.avgFocusMinutes} phút`} icon={ClockIcon} accent="border-emerald-200 bg-emerald-50 text-emerald-600" />
                <StatCard label="TB Quiz" value={`${child.avgQuizScore}%`} icon={TrophyIcon} accent="border-amber-200 bg-amber-50 text-amber-600" />
                <StatCard label="Streak" value={`${child.streak} ngày`} icon={FireIcon} accent="border-orange-200 bg-orange-50 text-orange-500" />
                <StatCard label="Tổng điểm" value={child.totalPoints.toLocaleString()} icon={StarIcon} accent="border-purple-200 bg-purple-50 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                {/* Weekly Chart */}
                <div className="xl:col-span-3 rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <ChartBarIcon className="h-5 w-5 text-blue-500" />
                        Biểu đồ tuần
                    </h4>
                    <WeeklyBarLineChart data={child.weeklyData} />
                </div>

                {/* Completion + Summary Panel */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Completion */}
                    <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md">
                        <h4 className="mb-3 text-lg font-bold text-slate-900">Tiến độ bài tập</h4>
                        <div className="flex items-center gap-4">
                            {/* Circular progress */}
                            <div className="relative h-24 w-24 flex-shrink-0">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3"
                                        strokeDasharray={`${completionRate}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-black text-slate-900">{completionRate}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">
                                    {child.tasksCompleted}/{child.tasksTotal}
                                </p>
                                <p className="text-sm text-slate-500">bài đã hoàn thành</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md">
                        <h4 className="mb-3 text-lg font-bold text-slate-900">Nhận xét nhanh</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                <span className="text-slate-700">
                                    {child.avgQuizScore >= 80
                                        ? 'Điểm quiz trung bình tốt, bé nắm bài chắc.'
                                        : 'Điểm quiz cần cải thiện, nên ôn lại bài cũ.'}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CalendarDaysIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span className="text-slate-700">
                                    Streak hiện tại: <strong>{child.streak} ngày liên tiếp</strong>.
                                    {child.streak >= 7 ? ' Rất tốt!' : ' Hãy khuyến khích bé học đều hơn.'}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                                <span className="text-slate-700">
                                    TB {child.avgFocusMinutes} phút/buổi.
                                    {child.avgFocusMinutes >= 20
                                        ? ' Tập trung tốt.'
                                        : ' Nên tăng dần thời gian phiên học.'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Recent Tasks Table */}
            <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ClipboardIcon className="h-5 w-5 text-blue-500" />
                    Bài tập gần đây
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Bài học</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Trạng thái</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Điểm</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ngày</th>
                            </tr>
                        </thead>
                        <tbody>
                            {child.recentTasks.map((task, i) => {
                                const statusInfo = getStatusInfo(task.status)
                                return (
                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{task.title}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                                    statusInfo.color
                                                )}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.score !== null ? (
                                                <span className={cn('font-bold', getScoreColor(task.score))}>
                                                    {task.score}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">–</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{task.date}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function WeeklyBarLineChart({ data }: { data: { day: string; minutes: number; score: number }[] }) {
    const maxMinutes = Math.max(1, ...data.map((item) => item.minutes))
    const width = 700
    const height = 220
    const linePoints = data
        .map((item, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * width
            const y = height - (item.score / 100) * (height - 24)
            return `${x},${Math.max(16, y)}`
        })
        .join(' ')

    return (
        <div>
            <div className="mb-3 flex items-center gap-4 text-xs font-semibold">
                <div className="inline-flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                    Cột: Thời gian học (phút)
                </div>
                <div className="inline-flex items-center gap-2 text-emerald-700">
                    <span className="h-0.5 w-5 bg-emerald-500" />
                    Đường nối: Điểm quiz (%)
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 pb-3 pt-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-x-3 top-4 h-[220px] w-[calc(100%-24px)]">
                    <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={linePoints}
                    />
                    {data.map((item, index) => {
                        const cx = (index / Math.max(data.length - 1, 1)) * width
                        const cy = Math.max(16, height - (item.score / 100) * (height - 24))
                        return <circle key={`${item.day}-dot`} cx={cx} cy={cy} r="5" fill="#10b981" />
                    })}
                </svg>

                <div className="relative flex h-[220px] items-end gap-3">
                    {data.map((item) => (
                        <div key={item.day} className="flex flex-1 flex-col items-center justify-end gap-1">
                            <span className="text-xs font-bold text-slate-700">{item.minutes || '–'}</span>
                            <div
                                className={cn(
                                    'w-full rounded-t-md transition-all',
                                    item.minutes > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-200'
                                )}
                                style={{ height: `${Math.max((item.minutes / maxMinutes) * 160, 8)}px` }}
                            />
                            <span className="text-[11px] font-semibold text-slate-500">{item.day}</span>
                            <span className={cn('text-[10px] font-bold', item.score ? getScoreColor(item.score) : 'text-slate-300')}>
                                {item.score || '–'}%
                            </span>
                        </div>
                    ))}
                </div>
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

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
        </svg>
    )
}
