'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { api, RewardItem, RewardRedemption } from '@/lib/api-client'

function redemptionBadge(status: RewardRedemption['status']) {
    if (status === 'requested') {
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">Chờ duyệt</span>
    }
    if (status === 'approved') {
        return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-600">Chờ trao quà</span>
    }
    if (status === 'fulfilled') {
        return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-600">Đã trao</span>
    }
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-600">Từ chối</span>
}

export default function ParentRewardsPage() {
    const supabase = useMemo(() => createClient(), [])
    const [parentId, setParentId] = useState('')
    const [items, setItems] = useState<RewardItem[]>([])
    const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [costPoints, setCostPoints] = useState(100)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [actionId, setActionId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (id: string) => {
        const [store, requests] = await Promise.all([
            api.rewards.listStore({ parentId: id }),
            api.rewards.listRedemptions({ parentId: id }),
        ])
        setItems(store)
        setRedemptions(requests)
    }, [])

    useEffect(() => {
        let isMounted = true

        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                if (!isMounted) return
                setParentId(user.id)
                await load(user.id)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể tải phần thưởng')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        void init()

        return () => {
            isMounted = false
        }
    }, [load, supabase])

    useEffect(() => {
        if (!parentId) return

        const refresh = () => {
            void load(parentId)
        }

        const channel = supabase
            .channel(`parent-rewards-${parentId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `parent_id=eq.${parentId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_items', filter: `parent_id=eq.${parentId}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions', filter: `parent_id=eq.${parentId}` }, refresh)
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [load, parentId, supabase])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const normalizedCost = Number(costPoints)
        if (!parentId || !title.trim() || !Number.isInteger(normalizedCost) || normalizedCost <= 0) return

        setSaving(true)
        setError(null)
        try {
            await api.rewards.createStoreItem({
                parentId,
                title: title.trim(),
                description: description.trim() || undefined,
                costPoints: normalizedCost,
            })
            setTitle('')
            setDescription('')
            setCostPoints(100)
            await load(parentId)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo phần thưởng')
        } finally {
            setSaving(false)
        }
    }

    async function runAction(id: string, action: () => Promise<unknown>) {
        if (actionId) return
        setActionId(id)
        setError(null)
        try {
            await action()
            await load(parentId)
        } catch (err) {
            console.error('Lỗi khi cập nhật quà:', err)
            setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái')
        } finally {
            setActionId(null)
        }
    }

    if (loading) {
        return <div className="p-8 text-sm font-bold text-slate-400">Đang tải phần thưởng...</div>
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Reward store</p>
                <h1 className="mt-1 text-3xl font-black text-slate-900">Quản lý quà thưởng đổi XP</h1>
                <p className="mt-1 text-sm text-slate-500">Tạo các phần thưởng như đi công viên, bánh snack, hoặc 30 phút xem phim. Bé đủ XP thì có thể gửi yêu cầu đổi.</p>
            </div>

            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

            <section className="grid gap-5 lg:grid-cols-3">
                <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-1">
                    <h2 className="text-lg font-black text-slate-900">Thêm quà thưởng mới</h2>
                    <div className="mt-4 space-y-3">
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Tên quà thưởng</span>
                            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Đi công viên" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Mô tả</span>
                            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Cuối tuần cả nhà đi chơi" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Cần XP</span>
                            <input type="number" min={1} value={costPoints} onChange={(event) => setCostPoints(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </label>
                    </div>
                    <button disabled={saving || !title.trim() || costPoints <= 0} className="mt-5 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? 'Đang lưu...' : 'Tạo phần thưởng'}
                    </button>
                </form>

                <div className="space-y-3 lg:col-span-2">
                    <h2 className="text-lg font-black text-slate-900">Danh sách quà thưởng</h2>
                    {items.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">Chưa có phần thưởng nào.</div>
                    ) : items.map((item) => (
                        <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-black text-slate-900">{item.title}</p>
                                    <p className="mt-1 text-sm text-slate-500">{item.description || 'Không có mô tả'}</p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-600">{item.cost_points} XP</span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    disabled={actionId !== null}
                                    onClick={() => runAction(`toggle-${item.id}`, () => api.rewards.updateStoreItem(item.id, { parentId, isActive: !item.is_active }))}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {item.is_active ? 'Tạm ẩn' : 'Bật lại'}
                                </button>
                                <button
                                    disabled={actionId !== null}
                                    onClick={() => runAction(`delete-${item.id}`, () => api.rewards.deleteStoreItem(item.id, parentId))}
                                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                    Xóa
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900">Yêu cầu đổi quà thưởng</h2>
                {redemptions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">Chưa có yêu cầu đổi quà thưởng.</div>
                ) : redemptions.map((request) => {
                    const isRequested = request.status === 'requested'
                    const isApproved = request.status === 'approved'
                    const canReject = isRequested || isApproved

                    return (
                        <article key={request.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-black text-slate-900">{request.title}</p>
                                        {redemptionBadge(request.status)}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">Bé: {request.profiles?.full_name || 'Chưa đặt tên'} - {request.cost_points} XP</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={!isRequested || actionId !== null}
                                        onClick={() => runAction(`approve-${request.id}`, () => api.rewards.updateRedemptionStatus(request.id, parentId, 'approved'))}
                                        className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                    >
                                        Duyệt
                                    </button>
                                    <button
                                        disabled={!isApproved || actionId !== null}
                                        onClick={() => runAction(`fulfill-${request.id}`, () => api.rewards.updateRedemptionStatus(request.id, parentId, 'fulfilled'))}
                                        className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                        Đã trao
                                    </button>
                                    <button
                                        disabled={!canReject || actionId !== null}
                                        onClick={() => runAction(`reject-${request.id}`, () => api.rewards.updateRedemptionStatus(request.id, parentId, 'rejected'))}
                                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </section>
        </div>
    )
}
