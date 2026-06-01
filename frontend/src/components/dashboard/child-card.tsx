import Link from 'next/link'
import {
    UserIcon,
    AcademicCapIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    FireIcon,
    TrophyIcon,
    StarIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

interface ChildCardProps {
    id: string
    name: string
    email?: string
    grade?: number
    points?: number
    streak?: number
    rank?: string
    status?: 'learning' | 'completed' | 'need-reminder' | 'idle'
    badge?: string
    avatarUrl?: string
}

const statusConfig = {
    learning: { label: 'Đang học', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Hoàn thành hôm nay', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'need-reminder': { label: 'Cần nhắc nhở', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    idle: { label: 'Chưa học hôm nay', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export function ChildCard({
    id,
    name,
    email,
    grade = 1,
    points = 0,
    streak = 0,
    rank,
    status = 'idle',
    badge,
    avatarUrl,
}: ChildCardProps) {
    const getInitials = (name: string) => {
        const words = name.trim().split(/\s+/).filter(Boolean)
        if (words.length === 0) return 'B'
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }

    const statusInfo = statusConfig[status]

    return (
        <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-md transition-all hover:border-blue-300 hover:shadow-xl">
            {/* Badge thành tích */}
            {badge && (
                <div className="absolute right-3 top-3">
                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        {badge}
                    </div>
                </div>
            )}

            {/* Avatar + Info */}
            <div className="mb-4 flex items-start gap-4">
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={name}
                            className="h-16 w-16 rounded-full border-2 border-blue-200 object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-indigo-100 text-xl font-bold text-blue-600">
                            {getInitials(name)}
                        </div>
                    )}
                    {/* Status indicator dot */}
                    <div
                        className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                            status === 'learning'
                                ? 'bg-blue-500'
                                : status === 'completed'
                                ? 'bg-emerald-500'
                                : status === 'need-reminder'
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                        }`}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-900">{name}</h3>
                    <p className="text-sm text-slate-500">Lớp {grade}</p>
                    <div className={`mt-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-white/80 p-3 shadow-sm">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-600">
                        <StarIcon className="h-4 w-4" />
                        <span className="text-sm font-bold">{points.toLocaleString()}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">Điểm</p>
                </div>

                <div className="text-center border-x border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                        <FireIcon className="h-4 w-4" />
                        <span className="text-sm font-bold">{streak}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">Streak</p>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600">
                        <TrophyIcon className="h-4 w-4" />
                        <span className="text-sm font-bold">{rank || '--'}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">Hạng</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
                <Link
                    href={`/parent/children/${id}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-600"
                >
                    <UserIcon className="h-4 w-4" />
                    Chi tiết
                </Link>

                <Link
                    href={`/parent/assign?childId=${id}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-600"
                >
                    <AcademicCapIcon className="h-4 w-4" />
                    Giao bài
                </Link>

                <Link
                    href={`/parent/children/${id}/progress`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                    <ChartBarIcon className="h-4 w-4" />
                    Tiến độ
                </Link>

                <Link
                    href={`/parent/children/${id}/settings`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Cài đặt
                </Link>
            </div>
        </div>
    )
}
