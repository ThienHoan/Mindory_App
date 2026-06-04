'use client'

import { useCallback, useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    CheckCircle,
    CheckCircle2,
    Clock3,
    FileQuestion,
    Pencil,
    Play,
    Plus,
    Save,
    Share2,
    Trash2,
    UserRound,
    UsersRound,
    XCircle,
} from 'lucide-react'
import { AIAssignment, AIQuizDocument, AIQuizQuestion, api } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'

type QuestionStatus = 'pending' | 'approved' | 'rejected'

type QuestionDraft = {
    question: string
    options: string[]
    correct_index: number
    status: QuestionStatus
}

type ChildOption = {
    id: string
    full_name: string | null
    email: string | null
}

const questionStatusMeta: Record<QuestionStatus, { label: string; className: string }> = {
    approved: { label: 'Đã duyệt', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    pending: { label: 'Chờ duyệt', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    rejected: { label: 'Đã loại', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}

const assignmentStatusMeta: Record<AIAssignment['status'], { label: string; className: string }> = {
    assigned: { label: 'Chưa làm', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    completed: { label: 'Đã hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
}

function makeEmptyDraft(): QuestionDraft {
    return {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        status: 'pending',
    }
}

function toDraft(question: AIQuizQuestion): QuestionDraft {
    return {
        question: question?.question ?? '',
        options: Array.isArray(question?.options) ? [...question.options] : ['', '', '', ''],
        correct_index: Number.isInteger(question?.correct_index) ? question.correct_index : 0,
        status: (question?.status as QuestionStatus) || 'pending',
    }
}

function validateDraft(draft: QuestionDraft) {
    if (!draft.question.trim()) return 'Vui lòng nhập nội dung câu hỏi.'
    if (!Array.isArray(draft.options) || draft.options.length !== 4) return 'Câu hỏi cần đúng 4 đáp án.'
    if (draft.options.some((opt) => !opt.trim())) return 'Vui lòng nhập đầy đủ 4 đáp án.'
    if (draft.correct_index < 0 || draft.correct_index > 3) return 'Đáp án đúng không hợp lệ.'
    return null
}

function formatDate(value?: string | null) {
    if (!value) return 'Chưa rõ ngày'
    return new Date(value).toLocaleDateString('vi-VN')
}

function getChildDisplayName(child?: ChildOption | null) {
    return child?.full_name || child?.email || 'Bé yêu'
}

function getAssignmentDisplayName(assignment: AIAssignment, children: ChildOption[]) {
    const child = children.find((item) => item.id === assignment.child_id)
    return assignment.profiles?.full_name || assignment.profiles?.email || getChildDisplayName(child)
}

export default function ReviewQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = useMemo(() => createClient(), [])
    const [document, setDocument] = useState<AIQuizDocument | null>(null)
    const [questions, setQuestions] = useState<AIQuizQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [children, setChildren] = useState<ChildOption[]>([])
    const [selectedChildId, setSelectedChildId] = useState('')
    const [assignments, setAssignments] = useState<AIAssignment[]>([])
    const [assigning, setAssigning] = useState(false)
    const [assignError, setAssignError] = useState('')

    const [creating, setCreating] = useState(false)
    const [newDraft, setNewDraft] = useState<QuestionDraft>(makeEmptyDraft())
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editDraft, setEditDraft] = useState<QuestionDraft>(makeEmptyDraft())

    const loadAssignments = useCallback(async () => {
        const assignmentData = await api.aiAssignments.listParent({ documentId: id })
        setAssignments(assignmentData)
        return assignmentData
    }, [id])

    const loadData = useCallback(async () => {
        try {
            const [doc, qs, assignmentData] = await Promise.all([
                api.aiQuizzes.getDocument(id),
                api.aiQuizzes.listQuestions(id),
                api.aiAssignments.listParent({ documentId: id })
            ])
            setDocument(doc)
            setQuestions(qs)
            setAssignments(assignmentData)
        } catch (error) {
            console.error('Failed to load:', error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        void loadData()
    }, [loadData])

    useEffect(() => {
        const channel = supabase
            .channel(`parent-ai-assignment-${id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'assigned_ai_quizzes', filter: `document_id=eq.${id}` },
                () => {
                    void loadAssignments()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [id, loadAssignments, supabase])

    useEffect(() => {
        const hasIncompleteAssignment = assignments.some((assignment) => assignment.status !== 'completed')
        if (!hasIncompleteAssignment) return

        const intervalId = window.setInterval(() => {
            void loadAssignments()
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [assignments, loadAssignments])

    useEffect(() => {
        const refreshOnFocus = () => {
            void loadAssignments()
        }
        const refreshOnVisible = () => {
            if (globalThis.document.visibilityState === 'visible') void loadAssignments()
        }

        window.addEventListener('focus', refreshOnFocus)
        globalThis.document.addEventListener('visibilitychange', refreshOnVisible)

        return () => {
            window.removeEventListener('focus', refreshOnFocus)
            globalThis.document.removeEventListener('visibilitychange', refreshOnVisible)
        }
    }, [loadAssignments])

    useEffect(() => {
        let active = true
        async function loadChildren() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const { data } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .eq('parent_id', user.id)
                    .eq('role', 'child')

                if (!active) return
                setChildren((data ?? []) as ChildOption[])
                if (!selectedChildId && data && data.length > 0) {
                    setSelectedChildId(data[0].id)
                }
            } catch (error) {
                console.error('Failed to load children:', error)
            }
        }

        void loadChildren()
        return () => {
            active = false
        }
    }, [selectedChildId, supabase])
    const handleStatusChange = async (questionId: string, status: QuestionStatus) => {
        try {
            await api.aiQuizzes.updateQuestionStatus(questionId, status)
            setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, status } : q)))
            if (editingId === questionId) {
                setEditDraft((prev) => ({ ...prev, status }))
            }
        } catch (error) {
            console.error('Update failed:', error)
        }
    }

    const handleApproveAll = async () => {
        try {
            const pendingQs = questions.filter((q) => q.status === 'pending')
            await Promise.all(pendingQs.map((q) => api.aiQuizzes.updateQuestionStatus(q.id, 'approved')))
            setQuestions((prev) => prev.map((q) => (q.status === 'pending' ? { ...q, status: 'approved' } : q)))
        } catch (error) {
            console.error('Approve all failed:', error)
        }
    }

    const updateDraftOption = (
        setter: React.Dispatch<React.SetStateAction<QuestionDraft>>,
        idx: number,
        value: string
    ) => {
        setter((prev) => {
            const nextOptions = [...prev.options]
            nextOptions[idx] = value
            return { ...prev, options: nextOptions }
        })
    }

    const handleCreateQuestion = async () => {
        const error = validateDraft(newDraft)
        if (error) {
            alert(error)
            return
        }

        try {
            const created = await api.aiQuizzes.createQuestion(id, {
                question: newDraft.question.trim(),
                options: newDraft.options.map((opt) => opt.trim()),
                correctIndex: newDraft.correct_index,
                status: newDraft.status,
            })
            setQuestions((prev) => [...prev, created])
            setNewDraft(makeEmptyDraft())
            setCreating(false)
        } catch (err) {
            console.error('Create question failed:', err)
            alert('Không thể thêm câu hỏi.')
        }
    }

    const startEdit = (question: AIQuizQuestion) => {
        setEditingId(question.id)
        setEditDraft(toDraft(question))
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditDraft(makeEmptyDraft())
    }

    const handleSaveEdit = async () => {
        if (!editingId) return

        const error = validateDraft(editDraft)
        if (error) {
            alert(error)
            return
        }

        try {
            const updated = await api.aiQuizzes.updateQuestion(editingId, {
                question: editDraft.question.trim(),
                options: editDraft.options.map((opt) => opt.trim()),
                correctIndex: editDraft.correct_index,
                status: editDraft.status,
            })
            setQuestions((prev) => prev.map((q) => (q.id === editingId ? updated : q)))
            cancelEdit()
        } catch (err) {
            console.error('Update question failed:', err)
            alert('Không thể cập nhật câu hỏi.')
        }
    }

    const handleDeleteQuestion = async (questionId: string) => {
        const yes = window.confirm('Bạn có chắc muốn xóa câu hỏi này?')
        if (!yes) return

        try {
            await api.aiQuizzes.deleteQuestion(questionId)
            setQuestions((prev) => prev.filter((q) => q.id !== questionId))
            if (editingId === questionId) cancelEdit()
        } catch (err) {
            console.error('Delete question failed:', err)
            alert('Không thể xóa câu hỏi.')
        }
    }

    const approvedCount = questions.filter((q) => q.status === 'approved').length
    const pendingCount = questions.filter((q) => q.status === 'pending').length
    const rejectedCount = questions.filter((q) => q.status === 'rejected').length
    const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed').length
    const selectedChild = children.find((child) => child.id === selectedChildId) || null
    const selectedAssignment = assignments.find((assignment) => assignment.child_id === selectedChildId) || null
    const selectedChildHasAssignment = Boolean(selectedAssignment)
    const selectedAssignmentComplete = selectedAssignment?.status === 'completed'
    const childQuizPath = selectedAssignment
        ? `/child/pdf-quiz/${id}?assignmentId=${selectedAssignment.id}`
        : `/child/pdf-quiz/${id}`
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${childQuizPath}` : ''

    const handleCopy = () => {
        if (!selectedAssignment) {
            setAssignError('Hãy giao bài cho bé trước khi copy link riêng.')
            return
        }

        if (!shareUrl) return
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setAssignError('')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleAssign = async () => {
        if (!selectedChildId) {
            setAssignError('Vui lòng chọn bé để giao bài.')
            return
        }
        if (selectedChildHasAssignment) {
            setAssignError('Bé này đã có bài được giao. Bạn có thể copy link riêng hoặc theo dõi trạng thái bên dưới.')
            return
        }
        setAssigning(true)
        setAssignError('')
        try {
            await api.aiAssignments.create({ documentId: id, childId: selectedChildId })
            await loadAssignments()
        } catch (error) {
            console.error('Assign failed:', error)
            setAssignError('Không thể giao bài cho bé. Vui lòng thử lại.')
        } finally {
            setAssigning(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    if (!document) {
        return <div className="text-center py-12">Không tìm thấy tài liệu</div>
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href="/parent/pdf-quiz" className="mt-1 rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">Duyệt bài AI</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{document.title}</h1>
                            <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                AI tạo gợi ý ban đầu, phụ huynh duyệt câu hỏi rồi giao bài riêng cho từng bé.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/child/pdf-quiz/${id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                        <Play className="h-4 w-4" />
                        Học thử
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng câu hỏi</p>
                        <FileQuestion className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{questions.length}</p>
                    <p className="mt-1 text-xs text-slate-500">{pendingCount} chờ duyệt, {rejectedCount} đã loại</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Đã duyệt</p>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{approvedCount}</p>
                    <p className="mt-1 text-xs text-slate-500">Câu hỏi sẵn sàng giao</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Đã giao</p>
                        <UsersRound className="h-5 w-5 text-violet-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{assignments.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Bé đã nhận bài</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Hoàn thành</p>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{completedAssignments}</p>
                    <p className="mt-1 text-xs text-slate-500">{completedAssignments}/{assignments.length || 0} bé đã làm xong</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <main className="space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900">Danh sách câu hỏi</h2>
                                <p className="mt-1 text-xs text-slate-500">Duyệt, sửa hoặc loại các câu hỏi trước khi giao cho bé. Duyệt tất cả chỉ áp dụng cho câu chờ duyệt.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreating((prev) => !prev)
                                        setNewDraft(makeEmptyDraft())
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm câu hỏi
                                </button>
                                {pendingCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={handleApproveAll}
                                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
                                    >
                                        Duyệt {pendingCount} câu chờ
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Đã duyệt hết câu chờ
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {creating && (
                        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="font-bold text-emerald-800">Thêm câu hỏi mới</h3>
                            <textarea
                                value={newDraft.question}
                                onChange={(e) => setNewDraft((prev) => ({ ...prev, question: e.target.value }))}
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Nhập nội dung câu hỏi"
                            />
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {newDraft.options.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        value={opt}
                                        onChange={(e) => updateDraftOption(setNewDraft, idx, e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={newDraft.correct_index}
                                    onChange={(e) => setNewDraft((prev) => ({ ...prev, correct_index: Number(e.target.value) }))}
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value={0}>Đáp án đúng: A</option>
                                    <option value={1}>Đáp án đúng: B</option>
                                    <option value={2}>Đáp án đúng: C</option>
                                    <option value={3}>Đáp án đúng: D</option>
                                </select>
                                <select
                                    value={newDraft.status}
                                    onChange={(e) => setNewDraft((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                >
                                    <option value="pending">Trạng thái: chờ duyệt</option>
                                    <option value="approved">Trạng thái: duyệt</option>
                                    <option value="rejected">Trạng thái: loại</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleCreateQuestion} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Lưu câu hỏi</button>
                                <button type="button" onClick={() => setCreating(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">Hủy</button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {questions.map((q, index) => {
                            const isEditing = editingId === q.id
                            const statusMeta = questionStatusMeta[q.status as QuestionStatus] ?? questionStatusMeta.pending
                            return (
                                <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition sm:p-6">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <textarea
                                                value={editDraft.question}
                                                onChange={(e) => setEditDraft((prev) => ({ ...prev, question: e.target.value }))}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                            />
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {editDraft.options.map((opt, idx) => (
                                                    <input
                                                        key={idx}
                                                        value={opt}
                                                        onChange={(e) => updateDraftOption(setEditDraft, idx, e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <select
                                                    value={editDraft.correct_index}
                                                    onChange={(e) => setEditDraft((prev) => ({ ...prev, correct_index: Number(e.target.value) }))}
                                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                                >
                                                    <option value={0}>Đáp án đúng: A</option>
                                                    <option value={1}>Đáp án đúng: B</option>
                                                    <option value={2}>Đáp án đúng: C</option>
                                                    <option value={3}>Đáp án đúng: D</option>
                                                </select>
                                                <select
                                                    value={editDraft.status}
                                                    onChange={(e) => setEditDraft((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                                >
                                                    <option value="pending">Trạng thái: chờ duyệt</option>
                                                    <option value="approved">Trạng thái: duyệt</option>
                                                    <option value="rejected">Trạng thái: loại</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={handleSaveEdit} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"><Save className="h-4 w-4" />Lưu sửa</button>
                                                <button type="button" onClick={cancelEdit} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">Hủy</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4 flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Câu {index + 1}</span>
                                                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                                                            {statusMeta.label}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-bold leading-6 text-slate-900">{q.question}</h3>
                                                </div>
                                                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                                    <button type="button" onClick={() => startEdit(q)} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" title="Sửa">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="rounded-lg bg-slate-100 p-2 text-rose-600 hover:bg-rose-50" title="Xóa">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleStatusChange(q.id, 'approved')} className={`rounded-lg p-2 transition ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`} title="Duyệt">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleStatusChange(q.id, 'rejected')} className={`rounded-lg p-2 transition ${q.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`} title="Loại bỏ">
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => (
                                                    <div
                                                        key={optIdx}
                                                        className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${optIdx === q.correct_index ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                                                    >
                                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${optIdx === q.correct_index ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </div>
                                                        <span>{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </main>

                <aside className="h-fit space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Giao bài cho bé</h2>
                        <p className="mt-1 text-xs text-slate-500">Chọn bé để giao bài AI và theo dõi trạng thái làm bài.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Bé đang chọn</label>
                        <select
                            value={selectedChildId}
                            onChange={(e) => {
                                setSelectedChildId(e.target.value)
                                setAssignError('')
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                            {children.length === 0 ? (
                                <option value="">Chưa có bé nào</option>
                            ) : (
                                children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {getChildDisplayName(child)}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600">
                                <UserRound className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">{selectedChild ? getChildDisplayName(selectedChild) : 'Chưa chọn bé'}</p>
                                <p className="mt-1 text-xs text-indigo-700">
                                    {selectedAssignment
                                        ? selectedAssignmentComplete
                                            ? 'Bé đã hoàn thành bài AI này.'
                                            : 'Bài đã giao, đang chờ bé hoàn thành.'
                                        : 'Bé chưa được giao bài này.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={assigning || children.length === 0 || selectedChildHasAssignment || approvedCount === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            {assigning ? 'Đang giao...' : selectedChildHasAssignment ? 'Đã giao cho bé này' : 'Giao bài'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!selectedAssignment}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            <Share2 className="h-4 w-4" />
                            {copied ? 'Đã copy link riêng' : 'Copy link của bé'}
                        </button>
                    </div>

                    {assignError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{assignError}</p>}
                    {approvedCount === 0 && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">Cần duyệt ít nhất một câu hỏi trước khi giao bài.</p>}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-black text-slate-900">Bài đã giao</h3>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                {completedAssignments}/{assignments.length || 0} hoàn thành
                            </span>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                                Chưa giao bài AI này cho bé nào.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assignments.map((assignment) => {
                                    const statusMeta = assignmentStatusMeta[assignment.status]
                                    return (
                                        <div key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-800">{getAssignmentDisplayName(assignment, children)}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">Giao ngày {formatDate(assignment.assigned_at)}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Clock3 className="h-4 w-4" />
                            Tự cập nhật trạng thái
                        </div>
                        <p className="mt-1 leading-5">Khi còn bé chưa hoàn thành, trang sẽ tự làm mới trạng thái mỗi 5 giây và khi bạn quay lại tab.</p>
                    </div>
                </aside>
            </div>
        </div>
    )
}
