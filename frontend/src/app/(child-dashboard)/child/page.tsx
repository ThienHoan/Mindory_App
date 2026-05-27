'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { api, Subject, Task } from '@/lib/api-client'

interface ChildProfile {
    id: string
    full_name: string | null
    xp: number | null
    grade: number | null
}

const subjectConfig: Record<string, { icon: string; color: string; bg: string; btnColor: string; btnText: string }> = {
    'Toán Học': {
        icon: '🔢',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        btnColor: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
        btnText: 'Học tiếp thôi!',
    },
    'Tiếng Việt': {
        icon: '📖',
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        btnColor: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
        btnText: 'Học tiếp thôi!',
    },
    'Khoa Học': {
        icon: '🔬',
        color: 'text-green-600',
        bg: 'bg-green-50',
        btnColor: 'bg-green-100 text-green-600 hover:bg-green-200',
        btnText: 'Bắt đầu ngay',
    },
    'Tiếng Anh': {
        icon: '🌍',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        btnColor: 'bg-orange-100 text-orange-500 hover:bg-orange-200',
        btnText: 'Bắt đầu ngay',
    },
}

function getSubjectConfig(name: string) {
    return subjectConfig[name] || {
        icon: '📚',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        btnColor: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
        btnText: 'Bắt đầu ngay',
    }
}

const subjectDesc: Record<string, string> = {
    'Toán Học': 'Cùng khám phá thế giới của các con số và hình khối nhé!',
    'Tiếng Việt': 'Học cách kể những câu chuyện hay và viết chữ đẹp nào.',
    'Khoa Học': 'Khám phá thiên nhiên và những thí nghiệm kỳ thú.',
    'Tiếng Anh': 'Luyện giao tiếp và học từ mới thật vui mỗi ngày.',
}

const weeklyQuests = [
    { icon: '🔥', label: 'Chuỗi 3 ngày', desc: 'Giữ vững phong độ nhé!', bg: 'bg-orange-50', border: 'border-orange-100' },
    { icon: '🧠', label: 'Siêu trí tuệ', desc: 'Hoàn thành 5 bài Toán', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { icon: '✏️', label: 'Họa sĩ nhí', desc: 'Làm bài tập Tiếng Việt', bg: 'bg-green-50', border: 'border-green-100' },
]

export default function ChildHomePage() {
    const supabase = useMemo(() => createClient(), [])
    const [profile, setProfile] = useState<ChildProfile | null>(null)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)

                    const grade = profileData.grade || 4

                    const [subjectsRes, tasksRes] = await Promise.allSettled([
                        api.subjects.listByGrade(grade),
                        api.tasks.listForChild(user.id),
                    ])

                    if (subjectsRes.status === 'fulfilled') {
                        setSubjects(subjectsRes.value.data)
                    }
                    if (tasksRes.status === 'fulfilled') {
                        setTasks(tasksRes.value.data)
                    }
                }
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [supabase])

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold text-purple-400 text-sm">Đang tải...</p>
                </div>
            </div>
        )
    }

    const xp = profile?.xp || 0
    const grade = profile?.grade || 4
    const completedTasksToday = tasks.filter((t) => t.status === 'completed').length
    const totalTasksToday = tasks.length
    const pomodoroTarget = 5
    const pomodoroDone = Math.min(completedTasksToday, pomodoroTarget)
    const pomodoroPercent = Math.round((pomodoroDone / pomodoroTarget) * 100)

    const subjectTaskMap: Record<string, { done: number; total: number; taskId?: string }> = {}
    tasks.forEach((t) => {
        const subjectName = t.lessons?.subjects?.name || 'Khác'
        if (!subjectTaskMap[subjectName]) subjectTaskMap[subjectName] = { done: 0, total: 0 }
        subjectTaskMap[subjectName].total += 1
        if (t.status === 'completed') subjectTaskMap[subjectName].done += 1
        if (!subjectTaskMap[subjectName].taskId) subjectTaskMap[subjectName].taskId = t.id
    })

    const nextRewardXP = 500
    const xpToReward = Math.max(0, nextRewardXP - (xp % nextRewardXP))

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 space-y-5">
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <span className="text-base">🚀</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800">Tiến độ hôm nay</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black text-purple-600">{pomodoroDone}</span>
                                <span className="text-xs text-gray-400">/{pomodoroTarget}</span>
                                <p className="text-[10px] font-bold text-gray-400">Phiên</p>
                            </div>
                        </div>

                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                                style={{ width: `${pomodoroPercent}%` }}
                            />
                        </div>

                        <p className="text-sm text-gray-500 mb-5">
                            {pomodoroDone >= pomodoroTarget
                                ? '🎉 Tuyệt vời! Bé đã đạt mục tiêu hôm nay rồi!'
                                : `Cố lên! Còn ${pomodoroTarget - pomodoroDone} phiên Pomodoro nữa thôi là đạt mục tiêu ngày rồi.`}
                        </p>

                        <Link
                            href="/child/quiz"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-purple-200"
                        >
                            <span>📝</span>
                            Làm kiểm tra ngay
                        </Link>
                        <Link
                            href="/child/games"
                            className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-emerald-200"
                        >
                            <span>🎮</span>
                            Chơi mini game
                        </Link>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-purple-200">
                        <div className="absolute right-4 bottom-2 text-5xl opacity-30">🏆</div>
                        <h3 className="text-white font-black text-base mb-1">Quà tặng sắp tới</h3>
                        <p className="text-purple-200 text-sm mb-4">
                            Chỉ còn <span className="text-white font-black">{xpToReward} XP</span> nữa để nhận Sticker Hiếm!
                        </p>
                    </div>
                </div>

                <div className="col-span-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-800">Môn học lớp {grade}</h2>
                        <Link href="/child/lesson" className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-1">
                            Xem tất cả <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(subjects.length > 0 ? subjects.slice(0, 4) : [
                            { id: 'm1', name: 'Toán Học', description: subjectDesc['Toán Học'], lesson_count: 20 },
                            { id: 'm2', name: 'Tiếng Việt', description: subjectDesc['Tiếng Việt'], lesson_count: 15 },
                            { id: 'm3', name: 'Khoa Học', description: subjectDesc['Khoa Học'], lesson_count: 10 },
                            { id: 'm4', name: 'Tiếng Anh', description: subjectDesc['Tiếng Anh'], lesson_count: 20 },
                        ]).map((subj) => {
                            const cfg = getSubjectConfig(subj.name)
                            const desc = subjectDesc[subj.name] || subj.description || 'Khám phá bài học thú vị ngay nào!'
                            const taskData = subjectTaskMap[subj.name]
                            const done = taskData?.done || 0
                            const total = taskData?.total || (subj.lesson_count || 0)
                            return (
                                <SubjectCard
                                    key={subj.id}
                                    name={subj.name}
                                    desc={desc}
                                    done={done}
                                    total={total}
                                    cfg={cfg}
                                    taskId={taskData?.taskId}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-black text-gray-800 mb-4">Thử thách tuần này</h2>
                <div className="grid grid-cols-3 gap-4">
                    {weeklyQuests.map((q, i) => (
                        <div key={i} className={`${q.bg} border ${q.border} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group`}>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                {q.icon}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-800">{q.label}</p>
                                <p className="text-xs text-gray-500">{q.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {tasks.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-800">Nhiệm vụ hôm nay</h2>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {completedTasksToday}/{totalTasksToday} hoàn thành
                        </span>
                    </div>
                    <div className="space-y-3">
                        {tasks.slice(0, 5).map((task) => {
                            const subjectName = task.lessons?.subjects?.name || 'Bài học'
                            const cfg = getSubjectConfig(subjectName)
                            const isDone = task.status === 'completed'
                            return (
                                <div key={task.id} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all">
                                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-xl shrink-0`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-black ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {task.lessons?.title || 'Bài học'}
                                        </p>
                                        <p className="text-xs text-gray-400">{subjectName}</p>
                                    </div>
                                    {isDone ? (
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">✓</div>
                                    ) : (
                                        <Link
                                            href={`/child/lesson?taskId=${task.id}`}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shrink-0"
                                        >
                                            Học ngay
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function SubjectCard({
    name, desc, done, total, cfg, taskId,
}: {
    name: string
    desc: string
    done: number
    total: number
    cfg: ReturnType<typeof getSubjectConfig>
    taskId?: string
}) {
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const isStarted = done > 0

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-12 h-12 ${cfg.bg} rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm`}>
                {cfg.icon}
            </div>

            <h3 className="text-base font-black text-gray-800 mb-1">{name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{desc}</p>

            {total > 0 && (
                <div className="mb-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">{done}/{total} bài đã hoàn thành</p>
                </div>
            )}

            <Link
                href={taskId ? `/child/lesson?taskId=${taskId}` : '/child/lesson'}
                className={`inline-block px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${cfg.btnColor}`}
            >
                {isStarted ? cfg.btnText : 'Bắt đầu ngay'}
            </Link>
        </div>
    )
}
