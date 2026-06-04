'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, AIAssignment } from '@/lib/api-client'

const COMPLETION_XP = 10

export default function ChildAIQuizPage() {
    const [assignments, setAssignments] = useState<AIAssignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        async function loadAssignments() {
            try {
                const data = await api.aiAssignments.listMine()
                if (!active) return
                setAssignments(data)
            } catch (error) {
                console.error('Failed to load AI assignments:', error)
            } finally {
                if (active) setLoading(false)
            }
        }

        void loadAssignments()
        return () => {
            active = false
        }
    }, [])

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl rounded-3xl border border-purple-100 bg-white p-6 text-center">
                Đang tải bài AI...
            </div>
        )
    }

    if (assignments.length === 0) {
        return (
            <div className="mx-auto max-w-5xl rounded-3xl border border-purple-100 bg-white p-8 text-center">
                <h2 className="text-xl font-black text-slate-800">Chưa có bài AI nào</h2>
                <p className="mt-2 text-sm text-slate-500">Bố mẹ sẽ giao bài AI cho bé ở đây nhé.</p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-black text-slate-800">Bài AI được giao</h1>
                <p className="text-sm text-slate-500">Chọn một bài để bắt đầu làm.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {assignments.map((assignment) => {
                    const document = Array.isArray(assignment.pdf_documents) ? assignment.pdf_documents[0] : assignment.pdf_documents
                    const title = assignment.documentTitle ?? assignment.document?.title ?? document?.title ?? 'Bài AI'
                    const statusLabel = assignment.status === 'completed' ? 'Đã hoàn thành' : 'Chưa làm'
                    return (
                        <div key={assignment.id} className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                                    <p className="mt-1 text-xs text-slate-400">Giao ngày {new Date(assignment.assigned_at).toLocaleDateString('vi-VN')}</p>
                                    {assignment.status !== 'completed' && (
                                        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-600">
                                            Hoàn thành +{COMPLETION_XP} XP
                                        </div>
                                    )}
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {statusLabel}
                                </span>
                            </div>
                            <Link
                                href={`/child/pdf-quiz/${assignment.document_id}?assignmentId=${assignment.id}`}
                                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white hover:bg-purple-700"
                            >
                                Bắt đầu làm
                            </Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
