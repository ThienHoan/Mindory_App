'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    FileText,
    ListChecks,
    Plus,
    Trash2,
    UploadCloud,
    UsersRound,
    XCircle,
} from 'lucide-react'
import { api, type AIAssignment, type AIQuizDocument } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'

type ActiveTab = 'documents' | 'assignments'
type AssignmentFilter = 'all' | AIAssignment['status']

const documentStatusMeta: Record<AIQuizDocument['status'], { label: string; className: string }> = {
    completed: { label: 'Sẵn sàng duyệt', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    processing: { label: 'Đang phân tích', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    error: { label: 'Lỗi xử lý', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}

const assignmentStatusMeta: Record<AIAssignment['status'], { label: string; className: string }> = {
    assigned: { label: 'Chưa làm', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    completed: { label: 'Đã hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    cancelled: { label: 'Đã hủy', className: 'border-slate-200 bg-slate-100 text-slate-600' },
}

function formatDate(value?: string | null) {
    if (!value) return 'Chưa rõ ngày'
    return new Date(value).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function getAssignmentChildName(assignment: AIAssignment) {
    return assignment.profiles?.full_name || assignment.profiles?.email || 'Bé yêu'
}

function getAssignmentDocumentTitle(assignment: AIAssignment, documents: AIQuizDocument[]) {
    const assignmentDocument = Array.isArray(assignment.pdf_documents)
        ? assignment.pdf_documents[0]
        : assignment.pdf_documents

    return assignmentDocument?.title || documents.find((doc) => doc.id === assignment.document_id)?.title || 'Bài AI'
}

export default function PDFQuizDashboard() {
    const [documents, setDocuments] = useState<AIQuizDocument[]>([])
    const [assignments, setAssignments] = useState<AIAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<ActiveTab>('documents')
    const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all')
    const [copiedAssignmentId, setCopiedAssignmentId] = useState<string | null>(null)
    const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    const loadDashboard = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const [data, assignmentData] = await Promise.all([
                api.aiQuizzes.listDocuments(),
                api.aiAssignments.listParent(),
            ])
            setDocuments(data)
            setAssignments(assignmentData)
        } catch (error) {
            console.error('Failed to load AI quiz dashboard:', error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadDashboard()
    }, [loadDashboard])

    useEffect(() => {
        const hasProcessingDocument = documents.some((doc) => doc.status === 'processing')
        const hasIncompleteAssignment = assignments.some((assignment) => assignment.status === 'assigned')
        if (!hasProcessingDocument && !hasIncompleteAssignment) return

        const intervalId = window.setInterval(() => {
            void loadDashboard(false)
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [assignments, documents, loadDashboard])

    useEffect(() => {
        const refreshOnFocus = () => {
            void loadDashboard(false)
        }
        const refreshOnVisible = () => {
            if (globalThis.document.visibilityState === 'visible') void loadDashboard(false)
        }

        window.addEventListener('focus', refreshOnFocus)
        globalThis.document.addEventListener('visibilitychange', refreshOnVisible)

        return () => {
            window.removeEventListener('focus', refreshOnFocus)
            globalThis.document.removeEventListener('visibilitychange', refreshOnVisible)
        }
    }, [loadDashboard])

    useEffect(() => {
        const channel = supabase
            .channel('parent-ai-assignments-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_ai_quizzes' }, () => {
                void loadDashboard(false)
            })
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [loadDashboard, supabase])

    const processingCount = documents.filter((doc) => doc.status === 'processing').length
    const activeAssignments = assignments.filter((assignment) => assignment.status !== 'cancelled')
    const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed').length
    const incompleteAssignments = assignments.filter((assignment) => assignment.status === 'assigned').length

    const sortedAssignments = useMemo(
        () => [...assignments].sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()),
        [assignments]
    )

    const filteredAssignments = useMemo(() => {
        if (assignmentFilter === 'all') return sortedAssignments
        return sortedAssignments.filter((assignment) => assignment.status === assignmentFilter)
    }, [assignmentFilter, sortedAssignments])

    const handleCopyAssignmentLink = async (assignment: AIAssignment) => {
        const path = `/child/pdf-quiz/${assignment.document_id}?assignmentId=${assignment.id}`
        const url = `${window.location.origin}${path}`
        await navigator.clipboard.writeText(url)
        setCopiedAssignmentId(assignment.id)
        window.setTimeout(() => setCopiedAssignmentId(null), 2000)
    }

    const handleCancelAssignment = async (assignment: AIAssignment) => {
        const yes = window.confirm('Bạn muốn hủy bài đã giao này? Bé sẽ không còn thấy bài trong danh sách cần làm.')
        if (!yes) return

        try {
            const cancelled = await api.aiAssignments.cancel(assignment.id)
            setAssignments((prev) => prev.map((item) => item.id === assignment.id ? cancelled : item))
        } catch (error) {
            console.error('Cancel assignment failed:', error)
            alert('Không thể hủy bài đã giao. Chỉ hủy được bài chưa hoàn thành.')
        }
    }

    const handleDeleteDocument = async (doc: AIQuizDocument) => {
        const docAssignments = assignments.filter((assignment) => assignment.document_id === doc.id)
        const completedCount = docAssignments.filter((assignment) => assignment.status === 'completed').length
        const activeCount = docAssignments.filter((assignment) => assignment.status !== 'cancelled').length

        if (completedCount > 0) {
            alert('Không thể xóa tài liệu vì đã có bé hoàn thành bài này. Hãy giữ lại để bảo toàn lịch sử học tập.')
            return
        }

        const message = activeCount > 0
            ? `Tài liệu "${doc.title}" đã được giao cho ${activeCount} bé. Xóa tài liệu sẽ hủy các bài đã giao chưa hoàn thành và xóa câu hỏi liên quan. Bạn muốn tiếp tục?`
            : `Bạn muốn xóa tài liệu "${doc.title}"? Thao tác này sẽ xóa câu hỏi liên quan và không thể hoàn tác.`

        const yes = window.confirm(message)
        if (!yes) return

        setDeletingDocumentId(doc.id)
        try {
            await api.aiQuizzes.deleteDocument(doc.id)
            setDocuments((prev) => prev.filter((item) => item.id !== doc.id))
            setAssignments((prev) => prev.filter((assignment) => assignment.document_id !== doc.id))
        } catch (error) {
            console.error('Delete document failed:', error)
            alert('Không thể xóa tài liệu. Nếu đã có bé hoàn thành bài, hệ thống sẽ không cho xóa để giữ lịch sử.')
        } finally {
            setDeletingDocumentId(null)
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">AI Quiz Hub</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Tài liệu & Bài tập AI</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Tải PDF, duyệt câu hỏi và theo dõi tất cả bài AI đã giao cho bé ở một nơi.
                        </p>
                    </div>
                    <Link
                        href="/parent/pdf-quiz/upload"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                        <UploadCloud className="h-4 w-4" />
                        Tải PDF mới
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tổng tài liệu</p>
                        <FileText className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{documents.length}</p>
                    <p className="mt-1 text-xs text-slate-500">PDF đã tải lên</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Đang xử lý</p>
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{processingCount}</p>
                    <p className="mt-1 text-xs text-slate-500">Tài liệu AI đang phân tích</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Đã giao</p>
                        <UsersRound className="h-5 w-5 text-violet-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{activeAssignments.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Lượt giao bài cho bé</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Hoàn thành</p>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">{completedAssignments}</p>
                    <p className="mt-1 text-xs text-slate-500">{incompleteAssignments} bài chưa làm</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'documents' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <FileText className="h-4 w-4" />
                    Tài liệu AI
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('assignments')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'assignments' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <ListChecks className="h-4 w-4" />
                    Bài đã giao
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
                </div>
            ) : activeTab === 'documents' ? (
                documents.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                        <h3 className="mb-2 text-lg font-bold text-slate-900">Chưa có tài liệu nào</h3>
                        <p className="mb-6 text-sm text-slate-500">Tải lên một tài liệu PDF để AI tự động tạo câu hỏi trắc nghiệm cho bé.</p>
                        <Link
                            href="/parent/pdf-quiz/upload"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                        >
                            <Plus className="h-4 w-4" />
                            Bắt đầu ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {documents.map((doc) => {
                            const statusMeta = documentStatusMeta[doc.status]
                            const docAssignments = assignments.filter((assignment) => assignment.document_id === doc.id)
                            const docCompletedCount = docAssignments.filter((assignment) => assignment.status === 'completed').length
                            const docActiveAssignmentCount = docAssignments.filter((assignment) => assignment.status !== 'cancelled').length
                            const canDeleteDocument = docCompletedCount === 0
                            const isDeletingDocument = deletingDocumentId === doc.id

                            return (
                                <div key={doc.id} className="flex min-h-[260px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-slate-900" title={doc.title}>{doc.title}</h3>
                                            <p className="mt-2 text-xs text-slate-500">Tải lên ngày {formatDate(doc.created_at)}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                                        <div className="rounded-xl bg-indigo-50 px-2 py-3 text-indigo-700">
                                            <p className="text-[10px] uppercase tracking-[0.1em] text-indigo-400">Đã giao</p>
                                            <p className="mt-1 text-base">{docActiveAssignmentCount} bé</p>
                                        </div>
                                        <div className="rounded-xl bg-emerald-50 px-2 py-3 text-emerald-700">
                                            <p className="text-[10px] uppercase tracking-[0.1em] text-emerald-400">Đã làm</p>
                                            <p className="mt-1 text-base">{docCompletedCount}/{docActiveAssignmentCount}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto grid gap-2 pt-5">
                                        {doc.status === 'completed' ? (
                                            <Link
                                                href={`/parent/pdf-quiz/${doc.id}`}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                                            >
                                                Duyệt & giao
                                            </Link>
                                        ) : doc.status === 'processing' ? (
                                            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                                                <Clock className="h-4 w-4" />
                                                Đang xử lý
                                            </div>
                                        ) : (
                                            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                                <AlertCircle className="h-4 w-4" />
                                                Cần tải lại PDF
                                            </div>
                                        )}
                                        {canDeleteDocument && (
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteDocument(doc)}
                                                disabled={isDeletingDocument}
                                                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${doc.status === 'error' ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {isDeletingDocument ? 'Đang xóa...' : 'Xóa tài liệu'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">Tất cả bài đã giao</h2>
                            <p className="mt-1 text-sm text-slate-500">Theo dõi bé nào đã làm xong và copy link riêng theo từng assignment.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {([
                                ['all', 'Tất cả'],
                                ['assigned', 'Chưa làm'],
                                ['completed', 'Đã hoàn thành'],
                                ['cancelled', 'Đã hủy'],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setAssignmentFilter(value)}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${assignmentFilter === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredAssignments.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                            <ListChecks className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-900">Chưa có bài phù hợp</h3>
                            <p className="mt-2 text-sm text-slate-500">Khi phụ huynh giao bài AI cho bé, danh sách sẽ xuất hiện tại đây.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_150px_130px_180px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:grid">
                                <span>Bé</span>
                                <span>Bài AI</span>
                                <span>Ngày giao</span>
                                <span>Trạng thái</span>
                                <span className="text-right">Thao tác</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {filteredAssignments.map((assignment) => {
                                    const statusMeta = assignmentStatusMeta[assignment.status]
                                    const documentTitle = getAssignmentDocumentTitle(assignment, documents)
                                    return (
                                        <div key={assignment.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_150px_130px_180px] lg:items-center lg:gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900">{getAssignmentChildName(assignment)}</p>
                                                <p className="mt-1 text-xs text-slate-500">Assignment riêng của bé</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 text-sm font-semibold text-slate-700">{documentTitle}</p>
                                            </div>
                                            <p className="text-sm text-slate-500">{formatDate(assignment.assigned_at)}</p>
                                            <div>
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                                {assignment.status !== 'cancelled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleCopyAssignmentLink(assignment)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        {copiedAssignmentId === assignment.id ? 'Đã copy' : 'Copy link'}
                                                    </button>
                                                )}
                                                {assignment.status === 'assigned' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleCancelAssignment(assignment)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Hủy
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/parent/pdf-quiz/${assignment.document_id}`}
                                                    className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                                                >
                                                    Chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
