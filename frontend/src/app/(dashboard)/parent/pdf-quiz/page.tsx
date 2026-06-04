'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { api, AIAssignment } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'

export default function PDFQuizDashboard() {
    const [documents, setDocuments] = useState<any[]>([])
    const [assignments, setAssignments] = useState<AIAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const loadDocuments = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const [data, assignmentData] = await Promise.all([
                api.aiQuizzes.listDocuments(),
                api.aiAssignments.listParent(),
            ])
            setDocuments(data)
            setAssignments(assignmentData)
        } catch (error) {
            console.error('Failed to load documents:', error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    useEffect(() => {
        const hasProcessing = documents.some(doc => doc.status === 'processing');
        if (!hasProcessing) return;

        const intervalId = setInterval(() => {
            loadDocuments(false); // pass false to avoid showing loading spinner on background refresh
        }, 5000);

        return () => clearInterval(intervalId);
    }, [documents, loadDocuments])

    useEffect(() => {
        const channel = supabase
            .channel('parent-ai-assignments-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_ai_quizzes' }, () => {
                void loadDocuments(false)
            })
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [loadDocuments, supabase])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Tài Liệu & Bài Tập AI</h1>
                <Link
                    href="/parent/pdf-quiz/upload"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Tải PDF Mới</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có tài liệu nào</h3>
                    <p className="text-slate-500 mb-6">Tải lên một tài liệu PDF để AI tự động tạo câu hỏi trắc nghiệm cho bé.</p>
                    <Link
                        href="/parent/pdf-quiz/upload"
                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                    >
                        Bắt đầu ngay
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => {
                        const docAssignments = assignments.filter((assignment) => assignment.document_id === doc.id)
                        const completedCount = docAssignments.filter((assignment) => assignment.status === 'completed').length
                        return (
                        <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-5 flex-grow">
                                <h3 className="font-semibold text-lg text-slate-800 mb-2 line-clamp-2" title={doc.title}>
                                    {doc.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm mt-4">
                                    {doc.status === 'completed' && (
                                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                            <CheckCircle className="w-4 h-4" /> Hoàn thành
                                        </span>
                                    )}
                                    {doc.status === 'processing' && (
                                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                            <Clock className="w-4 h-4" /> Đang phân tích...
                                        </span>
                                    )}
                                    {doc.status === 'error' && (
                                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                            <AlertCircle className="w-4 h-4" /> Lỗi
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400 mt-3">
                                    {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                                    <div className="rounded-lg bg-indigo-50 px-2 py-2 text-indigo-700">
                                        <p className="text-[10px] uppercase text-indigo-400">Đã giao</p>
                                        <p>{docAssignments.length} bé</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-700">
                                        <p className="text-[10px] uppercase text-emerald-400">Đã làm</p>
                                        <p>{completedCount}/{docAssignments.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                                {doc.status === 'completed' ? (
                                    <Link
                                        href={`/parent/pdf-quiz/${doc.id}`}
                                        className="text-indigo-600 font-medium hover:text-indigo-800 text-sm flex items-center gap-1"
                                    >
                                        Duyệt câu hỏi &rarr;
                                    </Link>
                                ) : doc.status === 'processing' ? (
                                    <span className="text-slate-500 text-sm">Vui lòng đợi...</span>
                                ) : (
                                    <span className="text-red-500 text-sm">Cần thử lại</span>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    )
}
