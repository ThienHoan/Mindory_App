'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PdfComponents = {
    Document: React.ComponentType<PdfDocumentProps>
    Page: React.ComponentType<PdfPageProps>
}

type PdfDocumentProps = {
    file?: string
    onLoadSuccess?: (data: { numPages: number }) => void
    loading?: React.ReactNode
    error?: React.ReactNode
    children?: React.ReactNode
}

type PdfPageProps = {
    pageNumber: number
    width: number
    renderAnnotationLayer: boolean
    renderTextLayer: boolean
    loading?: React.ReactNode
}

function clampPage(page: number, min: number, max: number) {
    return Math.min(Math.max(page, min), max)
}

function PdfLoadingDocument() {
    return <div className="p-10 text-center text-sm font-bold text-gray-400">Đang tải trình đọc PDF...</div>
}

function PdfLoadingPage() {
    return null
}

function BookPdfViewer({
    pdfUrl,
    title,
    startPage = 1,
    endPage,
    totalPages,
}: {
    pdfUrl: string
    title: string
    startPage?: number
    endPage?: number
    totalPages?: number
}) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(Math.max(1, startPage))
    const [pageWidth, setPageWidth] = useState(680)
    const [flipStage, setFlipStage] = useState<'idle' | 'out' | 'in'>('idle')
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
    const [pdfComponents, setPdfComponents] = useState<PdfComponents | null>(null)

    const minPage = Math.max(1, startPage)
    const knownLastPage = numPages ?? totalPages ?? endPage ?? minPage
    const maxPage = Math.max(minPage, Math.min(endPage ?? knownLastPage, knownLastPage))
    const pdfFile = useMemo(() => `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`, [pdfUrl])
    const Document = pdfComponents?.Document ?? PdfLoadingDocument
    const Page = pdfComponents?.Page ?? PdfLoadingPage

    useEffect(() => {
        let active = true

        async function loadPdfRenderer() {
            const mod = await import('react-pdf')
            mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
            if (active) setPdfComponents({ Document: mod.Document, Page: mod.Page })
        }

        void loadPdfRenderer()

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        setNumPages(null)
        setPageNumber(Math.max(1, startPage))
        setFlipStage('idle')
    }, [pdfUrl, startPage])

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === 'undefined') return

        const observer = new ResizeObserver(([entry]) => {
            setPageWidth(Math.min(760, Math.max(280, entry.contentRect.width - 32)))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        setPageNumber((current) => clampPage(current, minPage, maxPage))
    }, [maxPage, minPage])

    function turnTo(nextPage: number) {
        const target = clampPage(nextPage, minPage, maxPage)
        if (target === pageNumber || flipStage !== 'idle') return

        setFlipDirection(target > pageNumber ? 'next' : 'prev')
        setFlipStage('out')

        window.setTimeout(() => {
            setPageNumber(target)
            setFlipStage('in')
        }, 170)

        window.setTimeout(() => setFlipStage('idle'), 340)
    }

    const flipTransform =
        flipStage === 'out'
            ? flipDirection === 'next'
                ? 'rotateY(-74deg)'
                : 'rotateY(74deg)'
            : flipStage === 'in'
                ? flipDirection === 'next'
                    ? 'rotateY(10deg)'
                    : 'rotateY(-10deg)'
                : 'rotateY(0deg)'

    return (
        <section className="rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-purple-500">Tài liệu PDF</p>
                    <p className="text-sm font-bold text-gray-600">Trang {pageNumber}/{maxPage}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => turnTo(pageNumber - 1)}
                        disabled={pageNumber <= minPage || flipStage !== 'idle'}
                        className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-xs font-black text-purple-600 shadow-sm transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Trang trước
                    </button>
                    <button
                        type="button"
                        onClick={() => turnTo(pageNumber + 1)}
                        disabled={pageNumber >= maxPage || flipStage !== 'idle'}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Trang sau
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="overflow-hidden rounded-2xl bg-[#f8f4ec] px-2 py-5 shadow-inner [perspective:1400px]">
                <div
                    className="mx-auto origin-left rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
                    style={{
                        maxWidth: pageWidth,
                        transform: flipTransform,
                        transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                        transition: 'transform 170ms ease, opacity 170ms ease',
                        opacity: flipStage === 'out' ? 0.68 : 1,
                    }}
                >
                    <Document
                        file={pdfFile}
                        onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages)
                            setPageNumber((current) => clampPage(current, minPage, Math.min(endPage ?? numPages, numPages)))
                        }}
                        loading={<div className="p-10 text-center text-sm font-bold text-gray-400">Đang tải PDF...</div>}
                        error={
                            <div className="p-8 text-center">
                                <p className="text-sm font-bold text-red-500">Không thể nhúng PDF này.</p>
                                <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                                    Mở tài liệu gốc
                                </a>
                            </div>
                        }
                    >
                        <Page
                            key={pageNumber}
                            pageNumber={pageNumber}
                            width={pageWidth}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            loading={<div className="p-10 text-center text-sm font-bold text-gray-400">Đang mở trang...</div>}
                        />
                    </Document>
                </div>
            </div>
            <p className="mt-3 text-center text-xs font-bold text-gray-400">{title}</p>
        </section>
    )
}

export default BookPdfViewer
