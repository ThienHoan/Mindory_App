'use client'

import { useEffect, useState, useCallback } from 'react'
import { BACKEND_API_URL } from '@/lib/backend-url'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API = BACKEND_API_URL

type Subject = { id: string; name: string; grade: number }
type Lesson  = { id: string; title: string }
type Quiz = {
    id: string; lesson_id: string; question: string
    options: string[]; correct_index: number
    created_at: string; deleted_at: string | null
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

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function AdminQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedLesson, setSelectedLesson] = useState('')
    const [loading, setLoading] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Quiz | null>(null)
    const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Load subjects
    useEffect(() => {
        apiFetch('/subjects/admin/list?limit=100').then(d => setSubjects(d.data ?? [])).catch(() => {})
    }, [])

    // Load lessons when subject changes
    useEffect(() => {
        if (!selectedSubject) { setLessons([]); setSelectedLesson(''); return }
        apiFetch(`/lessons/admin/list?subjectId=${selectedSubject}&limit=100`)
            .then(d => { setLessons(d.data ?? []); setSelectedLesson('') })
            .catch(() => {})
    }, [selectedSubject])

    const load = useCallback(async () => {
        if (!selectedLesson) { setQuizzes([]); return }
        setLoading(true)
        try {
            const data = await apiFetch(`/quizzes/admin/list?lessonId=${selectedLesson}`)
            setQuizzes(Array.isArray(data) ? data : [])
        } catch { setError('Không thể tải câu hỏi') } finally { setLoading(false) }
    }, [selectedLesson])

    useEffect(() => { load() }, [load])

    function openCreate() {
        setEditing(null)
        setForm({ question: '', options: ['', '', '', ''], correctIndex: 0 })
        setError('')
        setModalOpen(true)
    }

    function openEdit(q: Quiz) {
        setEditing(q)
        const opts = [...(q.options ?? ['', '', '', ''])]
        while (opts.length < 4) opts.push('')
        setForm({ question: q.question, options: opts.slice(0, 4), correctIndex: q.correct_index })
        setError('')
        setModalOpen(true)
    }

    function setOption(idx: number, val: string) {
        setForm(f => { const opts = [...f.options]; opts[idx] = val; return { ...f, options: opts } })
    }

    async function handleSave() {
        if (!form.question.trim()) { setError('Câu hỏi không được để trống'); return }
        if (form.options.some(o => !o.trim())) { setError('Tất cả 4 đáp án phải được điền'); return }
        setSaving(true); setError('')
        try {
            if (editing) {
                await apiFetch(`/quizzes/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ question: form.question, options: form.options, correctIndex: form.correctIndex })
                })
            } else {
                await apiFetch('/quizzes', {
                    method: 'POST',
                    body: JSON.stringify({ lessonId: selectedLesson, question: form.question, options: form.options, correctIndex: form.correctIndex })
                })
            }
            setModalOpen(false)
            await load()
        } catch (e: any) {
            setError(e?.error ?? 'Đã có lỗi xảy ra')
        } finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await apiFetch(`/quizzes/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            await load()
        } catch { setError('Xóa thất bại') } finally { setDeleting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý Quiz</h2>
                    <p className="mt-1 text-sm text-gray-500">{quizzes.length} câu hỏi</p>
                </div>
                <button id="btn-create-quiz" onClick={openCreate} disabled={!selectedLesson}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    <PlusIcon className="h-4 w-4" /> Thêm câu hỏi
                </button>
            </div>

            {/* Cascading filter: Subject → Lesson */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Môn học:</label>
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Chọn môn --</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Lớp {s.grade})</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Bài học:</label>
                    <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                        disabled={!selectedSubject}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                        <option value="">-- Chọn bài --</option>
                        {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                </div>
            </div>

            {/* Quiz list */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
                {!selectedLesson ? (
                    <div className="p-8 text-center text-gray-400">Chọn bài học để xem câu hỏi</div>
                ) : loading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải...</div>
                ) : quizzes.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Chưa có câu hỏi nào cho bài học này</div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {quizzes.map((q, idx) => (
                            <div key={q.id} className={`p-6 ${q.deleted_at ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">
                                            <span className="text-gray-400 mr-2">Q{idx + 1}.</span>
                                            {q.question}
                                        </p>
                                        <div className="mt-2 grid grid-cols-2 gap-1">
                                            {(q.options ?? []).map((opt, i) => (
                                                <div key={i}
                                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${i === q.correct_index ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                                                    <span className={`font-bold ${i === q.correct_index ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {OPTION_LABELS[i]}.
                                                    </span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button id={`btn-edit-quiz-${q.id}`} onClick={() => openEdit(q)}
                                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button id={`btn-delete-quiz-${q.id}`}
                                            onClick={() => { setDeleteTarget(q); setError('') }}
                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" disabled={!!q.deleted_at}>
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Câu hỏi *</label>
                                <textarea id="input-quiz-question" value={form.question}
                                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                                    rows={2}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">4 Đáp án *</label>
                                <div className="space-y-2">
                                    {form.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <input type="radio" name="correct" checked={form.correctIndex === i}
                                                onChange={() => setForm(f => ({ ...f, correctIndex: i }))}
                                                className="accent-green-600" title={`Đáp án đúng: ${OPTION_LABELS[i]}`} />
                                            <span className="text-sm font-bold text-gray-500 w-5">{OPTION_LABELS[i]}.</span>
                                            <input id={`input-quiz-option-${i}`} type="text" value={opt}
                                                onChange={e => setOption(i, e.target.value)}
                                                placeholder={`Đáp án ${OPTION_LABELS[i]}`}
                                                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-1 text-xs text-gray-400">Chọn radio button để đánh dấu đáp án đúng</p>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
                            <button id="btn-save-quiz" onClick={handleSave} disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                        <p className="mt-2 text-sm text-gray-600">Xóa câu hỏi: <strong>"{deleteTarget.question}"</strong>?</p>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
                            <button id="btn-confirm-delete-quiz" onClick={handleDelete} disabled={deleting}
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
