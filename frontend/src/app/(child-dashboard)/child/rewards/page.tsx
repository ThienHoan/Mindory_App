'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { api, RewardItem, RewardRedemption } from '@/lib/api-client'

interface ChildProfile {
    id: string
    xp: number | null
    parent_id: string | null
}

export default function ChildRewardsPage() {
    const supabase = useMemo(() => createClient(), [])
    const [child, setChild] = useState<ChildProfile | null>(null)
    const [items, setItems] = useState<RewardItem[]>([])
    const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<string | null>(null)

    async function load(childId: string) {
        const [store, requests] = await Promise.all([
            api.rewards.listStore({ childId }),
            api.rewards.listRedemptions({ childId }),
        ])
        setItems(store.filter((item) => item.is_active))
        setRedemptions(requests)
    }

    useEffect(() => {
        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, xp, parent_id')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setChild(profile as ChildProfile)
                    await load(user.id)
                }
            } finally {
                setLoading(false)
            }
        }
        void init()
    }, [supabase])

    async function redeem(item: RewardItem) {
        if (!child) return
        setMessage(null)
        try {
            const result = await api.rewards.redeem(item.id, child.id)
            setChild({ ...child, xp: result.xp })
            setMessage(`Đã đổi quà: ${item.title}. Hãy chờ ba mẹ xác nhận nhé!`)
            await load(child.id)
        } catch (error) {
            console.error('Lỗi khi đổi quà:', error)
            setMessage('Chưa đủ XP để đổi quà này. Hoặc có lỗi xảy ra, thử lại sau nhé!')
        }
    }

    async function fulfill(request: RewardRedemption) {
        if (!child) return
        try {
            await api.rewards.fulfillRedemption(request.id, child.id)
            await load(child.id)
        } catch (error) {
            console.error('Lỗi khi nhận quà:', error)
            setMessage('Không thể xác nhận nhận quà. Thử lại sau nhé!')
        }
    }

    if (loading) {
        return <div className="p-8 text-sm font-bold text-purple-400">Đang tải quà thưởng...</div>
    }

    const xp = child?.xp ?? 0

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-8">
            <section className="rounded-3xl bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white shadow-lg shadow-purple-100">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-100">Reward store</p>
                <h1 className="mt-2 text-3xl font-black">Đổi quà bằng XP</h1>
                <p className="mt-2 text-sm font-bold text-purple-100">Bé đang có <span className="text-white">{xp} XP</span>. Chọn món quà mình thích nhé!</p>
            </section>

            {message ? <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</div> : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-purple-200 bg-white p-8 text-center text-sm font-bold text-slate-400 md:col-span-2 xl:col-span-3">Ba mẹ chưa tạo quà nào.</div>
                ) : items.map((item) => {
                    const enough = xp >= item.cost_points
                    return (
                        <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-black text-slate-900">{item.title}</p>
                                    <p className="mt-1 text-sm text-slate-500 line-clamp-3">{item.description || 'Phần thưởng đặc biệt từ ba mẹ.'}</p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">{item.cost_points} XP</span>
                            </div>
                            <button
                                onClick={() => redeem(item)}
                                disabled={!enough}
                                className="mt-5 w-full rounded-2xl bg-purple-600 py-3 text-sm font-black text-white hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                {enough ? 'Đổi quà này' : `Cần thêm ${item.cost_points - xp} XP`}
                            </button>
                        </article>
                    )
                })}
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900">Quà đã đổi</h2>
                {redemptions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400">Chưa đổi quà nào.</div>
                ) : redemptions.map((request) => {
                    const isRequested = request.status === 'requested'
                    const isApproved = request.status === 'approved'
                    const isFulfilled = request.status === 'fulfilled'
                    const isRejected = request.status === 'rejected'

                    const statusBadge = isRequested ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">Chờ ba mẹ duyệt</span>
                        : isApproved ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-600">Chờ bạn nhận quà</span>
                        : isFulfilled ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-600">Đã nhận quà</span>
                        : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-600">Từ chối</span>

                    return (
                        <div key={request.id} className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900">{request.title}</p>
                                    {statusBadge}
                                </div>
                                <p className="mt-1 text-xs font-bold text-slate-400">{request.cost_points} XP</p>
                            </div>
                            {isApproved && (
                                <button
                                    onClick={() => fulfill(request)}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-purple-700 active:scale-95 transition-all"
                                >
                                    Đã nhận quà! 🎉
                                </button>
                            )}
                        </div>
                    )
                })}
            </section>
        </div>
    )
}
