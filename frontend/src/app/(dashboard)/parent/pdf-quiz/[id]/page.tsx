'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Play, Share2, Pencil, Trash2, Plus, Save } from 'lucide-react'
import { api } from '@/lib/api-client'

type QuestionStatus = 'pending' | 'approved' | 'rejected'

type QuestionDraft = {
    question: string
    options: string[]
    correct_index: number
    status: QuestionStatus
}

function makeEmptyDraft(): QuestionDraft {
    return {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        status: 'pending',
    }
}

function toDraft(question: any): QuestionDraft {
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

export default function ReviewQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [document, setDocument] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    const [creating, setCreating] = useState(false)
    const [newDraft, setNewDraft] = useState<QuestionDraft>(makeEmptyDraft())
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editDraft, setEditDraft] = useState<QuestionDraft>(makeEmptyDraft())

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const [doc, qs] = await Promise.all([
                api.aiQuizzes.getDocument(id),
                api.aiQuizzes.listQuestions(id)
            ])
            setDocument(doc)
            setQuestions(qs)
        } catch (error) {
            console.error('Failed to load:', error)
        } finally {
            setLoading(false)
        }
    }

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

    const startEdit = (question: any) => {
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
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/child/pdf-quiz/${id}` : ''

    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    if (!document) {
        return <div className="text-center py-12">Không tìm thấy tài liệu</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/parent/pdf-quiz" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Duyệt Câu Hỏi: {document.title}</h1>
                    <p className="text-slate-500 text-sm">AI tạo gợi ý ban đầu, phụ huynh có thể thêm/sửa/xóa tự do.</p>
                </div>
            </div>

            {approvedCount > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-indigo-900 mb-1">Đã sẵn sàng cho bé!</h3>
                        <p className="text-indigo-700/80 text-sm">Bạn đã duyệt {approvedCount} câu hỏi. Gửi link này cho bé để bắt đầu.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleCopy}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 font-medium transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            {copied ? 'Đã copy!' : 'Copy Link'}
                        </button>
                        <Link
                            href={`/child/pdf-quiz/${id}`}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Học Thử
                        </Link>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <span className="font-medium text-slate-700">Trạng thái: {approvedCount}/{questions.length} câu đã duyệt</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setCreating((prev) => !prev)
                            setNewDraft(makeEmptyDraft())
                        }}
                        className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm câu hỏi
                    </button>
                    <button
                        onClick={handleApproveAll}
                        className="text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        Duyệt tất cả đang chờ
                    </button>
                </div>
            </div>

            {creating && (
                <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 space-y-4">
                    <h3 className="font-semibold text-emerald-800">Thêm câu hỏi mới</h3>
                    <textarea
                        value={newDraft.question}
                        onChange={(e) => setNewDraft((prev) => ({ ...prev, question: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Nhập nội dung câu hỏi"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {newDraft.options.map((opt, idx) => (
                            <input
                                key={idx}
                                value={opt}
                                onChange={(e) => updateDraftOption(setNewDraft, idx, e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={newDraft.correct_index}
                            onChange={(e) => setNewDraft((prev) => ({ ...prev, correct_index: Number(e.target.value) }))}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value={0}>Đáp án đúng: A</option>
                            <option value={1}>Đáp án đúng: B</option>
                            <option value={2}>Đáp án đúng: C</option>
                            <option value={3}>Đáp án đúng: D</option>
                        </select>
                        <select
                            value={newDraft.status}
                            onChange={(e) => setNewDraft((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="pending">Trạng thái: chờ duyệt</option>
                            <option value="approved">Trạng thái: duyệt</option>
                            <option value="rejected">Trạng thái: loại</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateQuestion} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">Lưu câu hỏi</button>
                        <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200">Hủy</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {questions.map((q, index) => {
                    const isEditing = editingId === q.id
                    return (
                        <div key={q.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-colors ${q.status === 'approved' ? 'border-green-200' : q.status === 'rejected' ? 'border-red-200 opacity-80' : 'border-slate-200'}`}>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={editDraft.question}
                                        onChange={(e) => setEditDraft((prev) => ({ ...prev, question: e.target.value }))}
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {editDraft.options.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                value={opt}
                                                onChange={(e) => updateDraftOption(setEditDraft, idx, e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <select
                                            value={editDraft.correct_index}
                                            onChange={(e) => setEditDraft((prev) => ({ ...prev, correct_index: Number(e.target.value) }))}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        >
                                            <option value={0}>Đáp án đúng: A</option>
                                            <option value={1}>Đáp án đúng: B</option>
                                            <option value={2}>Đáp án đúng: C</option>
                                            <option value={3}>Đáp án đúng: D</option>
                                        </select>
                                        <select
                                            value={editDraft.status}
                                            onChange={(e) => setEditDraft((prev) => ({ ...prev, status: e.target.value as QuestionStatus }))}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        >
                                            <option value="pending">Trạng thái: chờ duyệt</option>
                                            <option value="approved">Trạng thái: duyệt</option>
                                            <option value="rejected">Trạng thái: loại</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Save className="w-4 h-4" />Lưu sửa</button>
                                        <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200">Hủy</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <h3 className="font-medium text-slate-800 flex-grow">
                                            <span className="text-slate-400 mr-2">Câu {index + 1}:</span>
                                            {q.question}
                                        </h3>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => startEdit(q)}
                                                className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="p-2 rounded-lg bg-slate-100 text-red-600 hover:bg-red-50"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(q.id, 'approved')}
                                                className={`p-2 rounded-lg transition-colors ${q.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'}`}
                                                title="Duyệt"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(q.id, 'rejected')}
                                                className={`p-2 rounded-lg transition-colors ${q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                                                title="Loại bỏ"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => (
                                            <div
                                                key={optIdx}
                                                className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${optIdx === q.correct_index ? 'bg-green-50 border-green-200 font-medium text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                            >
                                                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${optIdx === q.correct_index ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
