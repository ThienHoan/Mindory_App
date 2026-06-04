'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { api, RewardItem, Subject, Task } from '@/lib/api-client'

interface ChildProfile {
    id: string
    full_name: string | null
    xp: number | null
    grade: number | null
}

const CORE_SUBJECT_KEYS = ['toan', 'tieng viet', 'tieng anh']
const COMPLETION_XP = 10

function normalizeSubjectName(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

function isCoreSubject(name: string) {
    const normalized = normalizeSubjectName(name)
    return CORE_SUBJECT_KEYS.some((key) => normalized.includes(key))
}

function todayKey() {
    return new Date().toLocaleDateString('en-CA')
}

function taskDateKey(task: Task) {
    return task.assigned_date?.slice(0, 10) ?? null
}

function isDueTask(task: Task) {
    const assignedDate = taskDateKey(task)
    return !assignedDate || assignedDate <= todayKey()
}

function formatTaskDate(task: Task) {
    const assignedDate = taskDateKey(task)
    if (!assignedDate) return 'Chưa có ngày giao'
    if (assignedDate === todayKey()) return 'Hôm nay'
    return assignedDate
}

const subjectConfig: Record<string, { icon: string; color: string; bg: string; btnColor: string; btnText: string }> = {
    Toán: {
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
    Toán: 'Cùng khám phá thế giới của các con số và hình khối nhé!',
    'Tiếng Việt': 'Học cách kể những câu chuyện hay và viết chữ đẹp nào.',
    'Tiếng Anh': 'Luyện giao tiếp và học từ mới thật vui mỗi ngày.',
}

export default function ChildHomePage() {
    const supabase = useMemo(() => createClient(), [])
    const [profile, setProfile] = useState<ChildProfile | null>(null)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [rewardItems, setRewardItems] = useState<RewardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [missingGrade, setMissingGrade] = useState(false)

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (!isMounted || !profileData) return

                setProfile(profileData)

                if (profileData.grade === null || profileData.grade === undefined) {
                    setMissingGrade(true)
                    return
                }

                const [subjectsRes, tasksRes, rewardsRes] = await Promise.allSettled([
                    api.subjects.listByGrade(profileData.grade),
                    api.tasks.listForChild(user.id),
                    api.rewards.listStore({ childId: user.id }),
                ])

                if (!isMounted) return

                if (subjectsRes.status === 'fulfilled') {
                    setSubjects(subjectsRes.value.data.filter((subject) => isCoreSubject(subject.name)))
                }
                if (tasksRes.status === 'fulfilled') {
                    setTasks(tasksRes.value.data)
                }
                if (rewardsRes.status === 'fulfilled') {
                    setRewardItems(rewardsRes.value.filter((item) => item.is_active))
                }
            } catch (error) {
                console.error('Error:', error)
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
        if (!profile?.id) return

        const channel = supabase
            .channel(`child-profile-${profile.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` }, (payload) => {
                setProfile((current) => current ? { ...current, ...(payload.new as Partial<ChildProfile>) } : current)
            })
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [profile?.id, supabase])

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                    <p className="text-sm font-bold text-purple-400">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (missingGrade) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="text-5xl">🧩</span>
                <p className="font-bold text-gray-600">Bé chưa được gán lớp.</p>
                <p className="text-sm text-gray-500">Phụ huynh cần chọn lớp khi tạo hồ sơ hoặc cập nhật trong phần quản lý.</p>
            </div>
        )
    }

    const xp = profile?.xp || 0
    const grade = profile?.grade ?? 1
    const dueTasks = tasks.filter(isDueTask)
    const futureTasksCount = tasks.length - dueTasks.length
    const completedTasks = dueTasks.filter((task) => task.status === 'completed').length
    const sessionTarget = dueTasks.reduce((sum, task) => sum + (task.sessions_per_day ?? 1), 0)
    const progressTarget = Math.max(1, sessionTarget)
    const progressDone = Math.min(completedTasks, progressTarget)
    const progressPercent = Math.round((progressDone / progressTarget) * 100)

    const subjectTaskMap: Record<string, { done: number; total: number; taskId?: string }> = {}
    dueTasks.forEach((task) => {
        const subjectName = task.lessons?.subjects?.name || 'Bài học'
        if (!subjectTaskMap[subjectName]) subjectTaskMap[subjectName] = { done: 0, total: 0 }
        subjectTaskMap[subjectName].total += 1
        if (task.status === 'completed') subjectTaskMap[subjectName].done += 1
        if (!subjectTaskMap[subjectName].taskId && task.status !== 'completed') subjectTaskMap[subjectName].taskId = task.id
    })

    const sortedRewards = rewardItems.slice().sort((a, b) => a.cost_points - b.cost_points)
    const nextReward = sortedRewards.find((item) => item.cost_points > xp) ?? sortedRewards[0]
    const xpToReward = nextReward ? Math.max(0, nextReward.cost_points - xp) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-8">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 space-y-5 lg:col-span-4">
                    <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100">
                                    <span className="text-base">🚀</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800">Tiến độ hôm nay</p>
                                    {futureTasksCount > 0 && (
                                        <p className="text-[10px] font-bold text-gray-400">{futureTasksCount} bài chưa tới ngày giao</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black text-purple-600">{progressDone}</span>
                                <span className="text-xs text-gray-400">/{sessionTarget || 0}</span>
                                <p className="text-[10px] font-bold text-gray-400">Phiên</p>
                            </div>
                        </div>

                        <div className="mb-3 h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                                style={{ width: `${sessionTarget ? progressPercent : 0}%` }}
                            />
                        </div>

                        <p className="mb-5 text-sm text-gray-500">
                            {dueTasks.length === 0
                                ? 'Hôm nay bé chưa có bài cần làm. Bài giao cho tương lai sẽ được giữ lại đúng ngày.'
                                : progressDone >= progressTarget
                                    ? '🎉 Tuyệt vời! Bé đã đạt mục tiêu hôm nay rồi!'
                                    : `Còn ${Math.max(0, progressTarget - progressDone)} phiên học nữa để đạt mục tiêu ngày.`}
                        </p>

                        <Link
                            href="/child/lesson"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-95"
                        >
                            <span>📚</span>
                            Vào phòng học
                        </Link>
                        <Link
                            href="/child/games"
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
                        >
                            <span>🎮</span>
                            Chơi mini game
                        </Link>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-purple-500 p-6 shadow-lg shadow-purple-200">
                        <div className="absolute bottom-2 right-4 text-5xl opacity-30">🏆</div>
                        <h3 className="mb-1 text-base font-black text-white">Quà tặng sắp tới</h3>
                        {nextReward ? (
                            <p className="mb-4 text-sm text-purple-200">
                                {xpToReward > 0 ? 'Chỉ còn ' : 'Đã đủ XP để đổi '}
                                <span className="font-black text-white">{xpToReward > 0 ? `${xpToReward} XP` : nextReward.title}</span>
                                {xpToReward > 0 ? ` nữa để nhận ${nextReward.title}.` : '.'}
                            </p>
                        ) : (
                            <p className="mb-4 text-sm text-purple-200">Phụ huynh chưa tạo quà trong kho.</p>
                        )}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-800">Môn học lớp {grade}</h2>
                        <Link href="/child/lesson" className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:underline">
                            Xem tất cả <span>→</span>
                        </Link>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center">
                            <p className="font-black text-gray-700">Chưa có môn học thật cho lớp này.</p>
                            <p className="mt-1 text-sm text-gray-500">Khi backend có subject theo lớp, danh sách sẽ hiển thị ở đây.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {subjects.slice(0, 4).map((subject) => {
                                const cfg = getSubjectConfig(subject.name)
                                const desc = subjectDesc[subject.name] || subject.description || 'Khám phá bài học thú vị ngay nào!'
                                const taskData = subjectTaskMap[subject.name]
                                return (
                                    <SubjectCard
                                        key={subject.id}
                                        name={subject.name}
                                        desc={desc}
                                        done={taskData?.done ?? 0}
                                        total={taskData?.total ?? 0}
                                        cfg={cfg}
                                        taskId={taskData?.taskId}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-800">Nhiệm vụ cần làm</h2>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-400">
                        {completedTasks}/{dueTasks.length} hoàn thành
                    </span>
                </div>

                {dueTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center">
                        <p className="text-sm font-black text-gray-700">Chưa có nhiệm vụ cần làm hôm nay.</p>
                        <p className="mt-1 text-xs text-gray-500">Bé có thể học tự do hoặc chơi mini game giải lao.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dueTasks.slice(0, 6).map((task) => {
                            const subjectName = task.lessons?.subjects?.name || 'Bài học'
                            const cfg = getSubjectConfig(subjectName)
                            const isDone = task.status === 'completed'
                            return (
                                <div key={task.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 transition-all hover:shadow-sm">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} text-xl`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-black ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {task.lessons?.title || 'Bài học'}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <p className="text-xs text-gray-400">{subjectName}</p>
                                            <p className="text-xs text-gray-400">{formatTaskDate(task)}</p>
                                            {!isDone && (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                                                    +{COMPLETION_XP} XP
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isDone ? (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">✓</div>
                                    ) : (
                                        <Link
                                            href={`/child/lesson?taskId=${task.id}`}
                                            className="shrink-0 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white transition-all hover:bg-purple-700 active:scale-95"
                                        >
                                            Học ngay
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
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
        <div className="rounded-3xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${cfg.bg} text-2xl shadow-sm`}>
                {cfg.icon}
            </div>

            <h3 className="mb-1 text-base font-black text-gray-800">{name}</h3>
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">{desc}</p>

            {total > 0 ? (
                <div className="mb-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-purple-400 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">{done}/{total} bài đã hoàn thành</p>
                </div>
            ) : (
                <p className="mb-3 text-[11px] text-gray-400">Chưa có nhiệm vụ được giao cho môn này.</p>
            )}

            {taskId && (
                <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-600">
                    Hoàn thành +{COMPLETION_XP} XP
                </div>
            )}

            <Link
                href={taskId ? `/child/lesson?taskId=${taskId}` : '/child/lesson'}
                className={`inline-block rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95 ${cfg.btnColor}`}
            >
                {isStarted ? cfg.btnText : 'Bắt đầu ngay'}
            </Link>
        </div>
    )
}
