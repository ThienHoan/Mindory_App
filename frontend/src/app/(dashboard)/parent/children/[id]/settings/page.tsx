'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { BACKEND_API_URL } from '@/lib/backend-url'
import { createClient } from '@/lib/supabase/client'

export default function ChildSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const childId = params.id as string
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fullName, setFullName] = useState('')
    const [grade, setGrade] = useState(1)

    useEffect(() => {
        async function loadChild() {
            setLoading(true)
            setError(null)
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, grade')
                    .eq('id', childId)
                    .single()

                if (data) {
                    setFullName(data.full_name ?? '')
                    setGrade(data.grade ?? 1)
                }
            } catch (err: any) {
                setError(err.message || 'Không thể tải hồ sơ trẻ')
            } finally {
                setLoading(false)
            }
        }

        loadChild()
    }, [childId, supabase])

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(null)

        const { data: { user: parentUser } } = await supabase.auth.getUser()
        if (!parentUser) {
            setError('Bạn cần đăng nhập để cập nhật hồ sơ trẻ.')
            setSaving(false)
            return
        }

        try {
            const res = await fetch(`${BACKEND_API_URL}/children/${childId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentId: parentUser.id,
                    grade,
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Không thể cập nhật hồ sơ trẻ')
            }

            setSuccess('Cập nhật lớp thành công!')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Quay lại
                </button>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Cài Đặt Hồ Sơ
                </h2>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-md">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                            <p className="mt-3 text-sm font-medium text-slate-600">Đang tải hồ sơ...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Thông tin lớp</h3>
                            <p className="text-sm text-slate-500">Bé sẽ học đúng lớp đã gán ở đây.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Tên bé</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    disabled
                                    className="mt-2 w-full rounded-md border-0 bg-slate-100 py-2 px-3 text-sm text-slate-600 shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Lớp</label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(Number(e.target.value))}
                                    className="mt-2 w-full rounded-md border-0 py-2 px-3 text-sm text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-300"
                                >
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <option key={value} value={value}>Lớp {value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                        )}
                        {success && (
                            <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
                        )}

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
