'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'

export default function UploadPDFPage() {
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const initialTitle = new URLSearchParams(window.location.search).get('title')
        if (initialTitle) setTitle((current) => current || initialTitle)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.type !== 'application/pdf') {
                setError('Vui lòng chọn file định dạng PDF.')
                return
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('Kích thước file không được vượt quá 10MB.')
                return
            }
            setFile(selectedFile)
            setError('')
            if (!title) {
                setTitle(selectedFile.name.replace('.pdf', ''))
            }
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title) {
            setError('Vui lòng nhập tên tài liệu và chọn file.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser()

            if (authError || !user) {
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            }

            const fileExt = file.name.split('.').pop() || 'pdf'
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `${user.id}/user_uploads/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'application/pdf',
                })

            if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

            const { data: publicData } = supabase.storage
                .from('pdfs')
                .getPublicUrl(filePath)

            if (!publicData?.publicUrl) {
                throw new Error('Cannot create PDF URL')
            }

            await api.aiQuizzes.upload(title, publicData.publicUrl)
            router.push('/parent/pdf-quiz')
        } catch (err: unknown) {
            console.error('Upload process failed:', err)
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình tải lên.')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Link href="/parent/pdf-quiz" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Tải Lên Tài Liệu PDF</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tên tài liệu / Chủ đề</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Khoa học lớp 3 - Bài 1"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">File PDF</label>

                        <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/50'}`}>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading}
                            />

                            {file ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-indigo-500 mb-3" />
                                    <span className="font-medium text-slate-700">{file.name}</span>
                                    <span className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span className="text-indigo-600 text-sm mt-4 cursor-pointer font-medium">Nhấn hoặc kéo thả để đổi file</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-slate-400 mb-3" />
                                    <span className="font-medium text-slate-700">Nhấn để chọn file hoặc kéo thả vào đây</span>
                                    <span className="text-sm text-slate-500 mt-1">Hỗ trợ file PDF lên đến 10MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !file || !title}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Tải lên & Sinh Câu Hỏi AI
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
