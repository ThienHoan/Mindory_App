'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

type Subject = { id: string; name: string; grade: number; created_at: string; deleted_at: string | null }

async function getToken() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
}

async function apiFetch(path: string, options?: RequestInit) {
    const token = await getToken()
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
    })
    return res.ok ? res.json() : Promise.reject(await res.json())
}

const GRADES = [1, 2, 3, 4, 5]

export default function AdminSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [gradeFilter, setGradeFilter] = useState<number | ''>('')

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Subject | null>(null)
    const [form, setForm] = useState({ name: '', grade: 1 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Confirm delete
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
    const [deleting, setDeleting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = gradeFilter ? `?grade=${gradeFilter}` : ''
            const data = await apiFetch(`/subjects/admin/list${params}`)
            setSubjects(data.data ?? [])
            setTotal(data.total ?? 0)
        } catch {
            setError('Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }, [gradeFilter])

    useEffect(() => { load() }, [load])

    function openCreate() {
        setEditing(null)
        setForm({ name: '', grade: 1 })
        setError('')
        setModalOpen(true)
    }

    function openEdit(s: Subject) {
        setEditing(s)
        setForm({ name: s.name, grade: s.grade })
        setError('')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!form.name.trim()) { setError('Tên môn học không được để trống'); return }
        setSaving(true)
        setError('')
        try {
            if (editing) {
                await apiFetch(`/subjects/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
            } else {
                await apiFetch('/subjects', { method: 'POST', body: JSON.stringify(form) })
            }
            setModalOpen(false)
            await load()
        } catch (e: any) {
            setError(e?.error ?? 'Đã có lỗi xảy ra')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiFetch(`/subjects/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            await load()
        } catch {
            setError('Xóa thất bại')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý Môn học</h2>
                    <p className="mt-1 text-sm text-gray-500">Tổng: {total} môn học</p>
                </div>
                <button
                    id="btn-create-subject"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    <PlusIcon className="h-4 w-4" /> Tạo môn học
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Lọc theo lớp:</label>
                <select
                    value={gradeFilter}
                    onChange={e => setGradeFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Tất cả</option>
                    {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải...</div>
                ) : subjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Chưa có môn học nào</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tên môn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khối lớp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày tạo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {subjects.map(s => (
                                <tr key={s.id} className={s.deleted_at ? 'opacity-40' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">Lớp {s.grade}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                id={`btn-edit-subject-${s.id}`}
                                                onClick={() => openEdit(s)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                id={`btn-delete-subject-${s.id}`}
                                                onClick={() => { setDeleteTarget(s); setError('') }}
                                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                disabled={!!s.deleted_at}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editing ? 'Sửa môn học' : 'Tạo môn học mới'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tên môn học *</label>
                                <input
                                    id="input-subject-name"
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    maxLength={200}
                                    placeholder="VD: Toán, Tiếng Việt..."
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Khối lớp *</label>
                                <select
                                    id="input-subject-grade"
                                    value={form.grade}
                                    onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                                </select>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >Hủy</button>
                            <button
                                id="btn-save-subject"
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >{saving ? 'Đang lưu...' : 'Lưu'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Bạn chắc chắn muốn xóa môn học <strong>"{deleteTarget.name}"</strong>?
                            Các bài học liên quan cũng sẽ bị xóa theo.
                        </p>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >Hủy</button>
                            <button
                                id="btn-confirm-delete-subject"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >{deleting ? 'Đang xóa...' : 'Xóa'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
