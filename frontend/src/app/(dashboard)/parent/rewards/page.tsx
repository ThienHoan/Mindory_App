'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { api, RewardItem, RewardRedemption } from '@/lib/api-client'

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
    const [error, setError] = useState<string | null>(null)

    async function load(id: string) {
        const [store, requests] = await Promise.all([
            api.rewards.listStore({ parentId: id }),
            api.rewards.listRedemptions({ parentId: id }),
        ])
        setItems(store)
        setRedemptions(requests)
    }

    useEffect(() => {
        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                setParentId(user.id)
                await load(user.id)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể tải phần thưởng')
            } finally {
                setLoading(false)
            }
        }
        void init()
    }, [supabase])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!parentId || !title.trim()) return
        setSaving(true)
        setError(null)
        try {
            await api.rewards.createStoreItem({
                parentId,
                title: title.trim(),
                description: description.trim() || undefined,
                costPoints,
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

    async function toggleItem(item: RewardItem) {
        if (!parentId) return
        await api.rewards.updateStoreItem(item.id, { parentId, isActive: !item.is_active })
        await load(parentId)
    }

    async function deleteItem(item: RewardItem) {
        if (!parentId) return
        await api.rewards.deleteStoreItem(item.id, parentId)
        await load(parentId)
    }

    async function updateRequest(id: string, status: 'approved' | 'fulfilled' | 'rejected') {
        if (!parentId) return
        setError(null)
        try {
            await api.rewards.updateRedemptionStatus(id, parentId, status)
            await load(parentId)
        } catch (err) {
            console.error('Lỗi khi duyệt quà:', err)
            setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái')
        }
    }

    if (loading) {
        return <div className="p-8 text-sm font-bold text-slate-400">Đang tải phần thưởng...</div>
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Reward store</p>
                <h1 className="mt-1 text-3xl font-black text-slate-900">Quản lý quà thưởng đổi điểm</h1>
                <p className="mt-1 text-sm text-slate-500">Tạo các phần thưởng như đi công viên, bánh snack, 30 phút xem phim. Bé đủ XP thì có thể đổi.</p>
            </div>

            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

            <section className="grid gap-5 lg:grid-cols-3">
                <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-1">
                    <h2 className="text-lg font-black text-slate-900">Thêm quà thưởng mới</h2>
                    <div className="mt-4 space-y-3">
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Tên quà thưởng</span>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Đi công viên" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Mô tả</span>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Cuối tuần cả nhà đi chơi" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-extrabold uppercase text-slate-700">Cần XP</span>
                            <input type="number" min={1} value={costPoints} onChange={(e) => setCostPoints(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                        </label>
                    </div>
                    <button disabled={saving || !title.trim()} className="mt-5 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50">
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
                                <button onClick={() => toggleItem(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
                                    {item.is_active ? 'Tạm ẩn' : 'Bật lại'}
                                </button>
                                <button onClick={() => deleteItem(item)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100">Xóa</button>
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
                    const isFulfilled = request.status === 'fulfilled'
                    const isRejected = request.status === 'rejected'

                    const statusBadge = isRequested ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">Chờ duyệt</span>
                        : isApproved ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-600">Chờ bé nhận</span>
                        : isFulfilled ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-600">Đã trao</span>
                        : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-600">Từ chối</span>

                    return (
                        <article key={request.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-black text-slate-900">{request.title}</p>
                                        {statusBadge}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">Bé: {request.profiles?.full_name || 'Chưa đặt tên'} - {request.cost_points} XP</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={!isRequested}
                                        onClick={() => updateRequest(request.id, 'approved')} 
                                        className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${isApproved ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} disabled:opacity-50`}
                                    >
                                        Duyệt
                                    </button>
                                    <button 
                                        disabled={isRejected || isFulfilled}
                                        onClick={() => updateRequest(request.id, 'rejected')} 
                                        className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${isRejected ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'} disabled:opacity-50`}
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
