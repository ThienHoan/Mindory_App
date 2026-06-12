'use client'

import { useEffect, useState } from 'react'
import { BACKEND_API_URL } from '@/lib/backend-url'
import { createClient } from '@/lib/supabase/client'
import {
    UserCircleIcon,
    EnvelopeIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface ProfileData {
    id: string
    email: string
    full_name: string | null
    role: string
    avatar_url: string | null
    created_at: string
}

export default function ParentProfilePage() {
    const supabase = createClient()

    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Form state
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    // Fetch profile from backend API
    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) return

                const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                })

                if (!res.ok) throw new Error('Không thể tải thông tin')
                const data: ProfileData = await res.json()
                setProfile(data)
                setFullName(data.full_name || '')
                setAvatarUrl(data.avatar_url || '')
            } catch {
                setToast({ type: 'error', message: 'Không thể tải thông tin hồ sơ' })
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [supabase])

    // Save profile
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setToast(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) throw new Error('Phiên đăng nhập hết hạn')

            const body: Record<string, string> = {}
            if (fullName.trim() && fullName !== profile?.full_name) body.fullName = fullName.trim()
            if (avatarUrl.trim() !== (profile?.avatar_url || '')) body.avatarUrl = avatarUrl.trim()

            if (Object.keys(body).length === 0) {
                setToast({ type: 'error', message: 'Không có thay đổi nào để lưu' })
                setSaving(false)
                return
            }

            const res = await fetch(`${BACKEND_API_URL}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(typeof errData.error === 'string' ? errData.error : 'Cập nhật thất bại')
            }

            const updated: ProfileData = await res.json()
            setProfile(updated)
            setFullName(updated.full_name || '')
            setAvatarUrl(updated.avatar_url || '')
            setToast({ type: 'success', message: 'Cập nhật hồ sơ thành công!' })
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Có lỗi xảy ra' })
        } finally {
            setSaving(false)
        }
    }

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(t)
    }, [toast])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    <p className="mt-3 text-sm font-medium text-slate-600">Đang tải hồ sơ...</p>
                </div>
            </div>
        )
    }

    const getInitials = (name: string | null) => {
        if (!name) return 'PH'
        const words = name.trim().split(/\s+/).filter(Boolean)
        if (words.length === 0) return 'PH'
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }

    const createdDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : '--'

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 shadow-md transition-all ${
                        toast.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-emerald-500" />
                    ) : (
                        <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-500" />
                    )}
                    <p className="text-sm font-semibold">{toast.message}</p>
                </div>
            )}

            {/* Header Card */}
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-black text-white shadow-lg">
                            {getInitials(profile?.full_name ?? null)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="truncate text-3xl font-black tracking-tight text-slate-900">
                            {profile?.full_name || 'Chưa đặt tên'}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <EnvelopeIcon className="h-4 w-4 text-blue-500" />
                                {profile?.email}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                                Tham gia: {createdDate}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                                Phụ huynh
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-md">
                <div className="mb-6 flex items-center gap-3">
                    <UserCircleIcon className="h-6 w-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa thông tin</h3>
                </div>

                <div className="space-y-5">
                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700">Email</label>
                        <input
                            type="email"
                            disabled
                            value={profile?.email || ''}
                            className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-400">Email không thể thay đổi</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-bold text-slate-700">
                            Họ và tên
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ và tên"
                            className="mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Avatar URL */}
                    <div>
                        <label htmlFor="avatarUrl" className="block text-sm font-bold text-slate-700">
                            URL Ảnh đại diện
                        </label>
                        <input
                            id="avatarUrl"
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <p className="mt-1 text-xs text-slate-400">Nhập đường dẫn URL hợp lệ đến ảnh</p>
                    </div>

                    {/* Avatar Preview */}
                    {avatarUrl && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Xem trước</label>
                            <img
                                src={avatarUrl}
                                alt="Preview"
                                className="h-20 w-20 rounded-full border-2 border-blue-200 object-cover shadow"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-end gap-3 border-t-2 border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={() => {
                            setFullName(profile?.full_name || '')
                            setAvatarUrl(profile?.avatar_url || '')
                        }}
                        className="rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Hủy thay đổi
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Đang lưu...
                            </>
                        ) : (
                            'Lưu thay đổi'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
