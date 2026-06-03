import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function extractGoogleDriveId(url: URL) {
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/)
    if (fileMatch?.[1]) return fileMatch[1]

    return url.searchParams.get('id')
}

function normalizePdfUrl(rawUrl: string) {
    const url = new URL(rawUrl)

    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Unsupported PDF URL protocol')
    }

    if (isBlockedHost(url.hostname)) {
        throw new Error('Blocked PDF URL host')
    }

    if (url.hostname === 'drive.google.com') {
        const fileId = extractGoogleDriveId(url)
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
        }
    }

    return url.toString()
}

function isBlockedHost(hostname: string) {
    const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (normalized === 'localhost' || normalized === '0.0.0.0' || normalized === '::1' || normalized.endsWith('.localhost')) {
        return true
    }

    const octets = normalized.split('.').map((part) => Number(part))
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false
    }

    const [first, second] = octets
    return first === 10 || first === 127 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
}

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawUrl = request.nextUrl.searchParams.get('url')
    if (!rawUrl) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    let sourceUrl: string
    try {
        sourceUrl = normalizePdfUrl(rawUrl)
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid PDF URL' }, { status: 400 })
    }

    const upstream = await fetch(sourceUrl, {
        cache: 'no-store',
        headers: {
            Accept: 'application/pdf,application/octet-stream,*/*',
            'User-Agent': 'Mindory PDF Viewer',
        },
        redirect: 'follow',
    })

    if (!upstream.ok) {
        return NextResponse.json({ error: `Failed to fetch PDF (${upstream.status})` }, { status: upstream.status })
    }

    const pdf = await upstream.arrayBuffer()
    return new NextResponse(pdf, {
        headers: {
            'Cache-Control': 'private, max-age=300',
            'Content-Disposition': 'inline; filename="lesson.pdf"',
            'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
        },
    })
}