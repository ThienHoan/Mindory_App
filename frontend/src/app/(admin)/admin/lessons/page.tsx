'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

type Subject = { id: string; name: string; grade: number }
type Lesson = {
    id: string; subject_id: string; title: string; description: string | null
    pdf_url: string; total_pages: number; created_at: string; deleted_at: string | null
    subjects: { name: string; grade: number }
}

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

export default function AdminLessonsPage() {
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [total, setTotal] = useState(0)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [subjectFilter, setSubjectFilter] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Lesson | null>(null)
    const [form, setForm] = useState({ subjectId: '', title: '', description: '', pdfUrl: '', totalPages: 1 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Load subjects for dropdown
    useEffect(() => {
        apiFetch('/subjects/admin/list?limit=100').then(d => setSubjects(d.data ?? [])).catch(() => {})
    }, [])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = subjectFilter ? `?subjectId=${subjectFilter}` : ''
            const data = await apiFetch(`/lessons/admin/list${params}`)
            setLessons(data.data ?? [])
            setTotal(data.total ?? 0)
        } catch {
            setError('Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }, [subjectFilter])

    useEffect(() => { load() }, [load])

    function openCreate() {
        setEditing(null)
        setForm({ subjectId: subjects[0]?.id ?? '', title: '', description: '', pdfUrl: '', totalPages: 1 })
        setError('')
        setModalOpen(true)
    }

    function openEdit(l: Lesson) {
        setEditing(l)
        setForm({ subjectId: l.subject_id, title: l.title, description: l.description ?? '', pdfUrl: l.pdf_url, totalPages: l.total_pages })
        setError('')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!form.title.trim()) { setError('Tiêu đề không được để trống'); return }
        if (!form.pdfUrl.trim()) { setError('PDF URL không được để trống'); return }
        setSaving(true); setError('')
        try {
            if (editing) {
                await apiFetch(`/lessons/${editing.id}`, { method: 'PUT', body: JSON.stringify({ title: form.title, description: form.description, pdfUrl: form.pdfUrl, totalPages: form.totalPages }) })
            } else {
                await apiFetch('/lessons', { method: 'POST', body: JSON.stringify({ subjectId: form.subjectId, title: form.title, description: form.description || undefined, pdfUrl: form.pdfUrl, totalPages: form.totalPages }) })
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
            await apiFetch(`/lessons/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            await load()
        } catch { setError('Xóa thất bại') } finally { setDeleting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý Bài học</h2>
                    <p className="mt-1 text-sm text-gray-500">Tổng: {total} bài học</p>
                </div>
                <button id="btn-create-lesson" onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    <PlusIcon className="h-4 w-4" /> Tạo bài học
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Lọc theo môn:</label>
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Tất cả</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Lớp {s.grade})</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải...</div>
                ) : lessons.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Chưa có bài học nào</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tiêu đề</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Môn học</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Số trang</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">PDF</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {lessons.map(l => (
                                <tr key={l.id} className={l.deleted_at ? 'opacity-40' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{l.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.subjects?.name} (Lớp {l.subjects?.grade})</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.total_pages}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <a href={l.pdf_url} target="_blank" rel="noreferrer"
                                            className="text-indigo-600 hover:underline truncate block max-w-[180px]">
                                            {l.pdf_url}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button id={`btn-edit-lesson-${l.id}`} onClick={() => openEdit(l)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button id={`btn-delete-lesson-${l.id}`}
                                                onClick={() => { setDeleteTarget(l); setError('') }}
                                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" disabled={!!l.deleted_at}>
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

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Sửa bài học' : 'Tạo bài học mới'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {!editing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Môn học *</label>
                                    <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Lớp {s.grade})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                                <input id="input-lesson-title" type="text" value={form.title} maxLength={200}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">PDF URL *</label>
                                <input id="input-lesson-pdf" type="url" value={form.pdfUrl}
                                    onChange={e => setForm(f => ({ ...f, pdfUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số trang</label>
                                <input type="number" min={1} value={form.totalPages}
                                    onChange={e => setForm(f => ({ ...f, totalPages: Number(e.target.value) }))}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea value={form.description} maxLength={1000}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button id="btn-save-lesson" onClick={handleSave} disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                        <p className="mt-2 text-sm text-gray-600">Xóa bài học <strong>"{deleteTarget.title}"</strong>? Các quiz liên quan cũng bị xóa.</p>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
                            <button id="btn-confirm-delete-lesson" onClick={handleDelete} disabled={deleting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                                {deleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
