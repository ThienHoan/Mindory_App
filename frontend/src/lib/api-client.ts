import { createClient } from './supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const inflightRequests = new Map<string, Promise<unknown>>()
const responseCache = new Map<string, { expiresAt: number; data: unknown }>()

export type ApiListResponse<T> = { data: T[] }

export interface Subject {
    id: string
    name: string
    grade: number
    description?: string
    lesson_count?: number
}

export interface Lesson {
    id: string
    subject_id: string
    title: string
    description: string
    pdf_url: string
    pdf_path?: string | null
    total_pages: number
    subjects?: { name: string; grade: number } | null
}

export interface Quiz {
    id: string
    question: string
    options: string[]
    correct_index: number
}

export interface Task {
    id: string
    lesson_id: string
    status: 'pending' | 'in_progress' | 'completed'
    session_duration_minutes: number
    start_page: number
    end_page: number
    lessons?: {
        id?: string
        title: string
        description: string
        pdf_url: string
        pdf_path?: string | null
        total_pages: number
        subjects?: { name: string } | null
    } | null
}

export interface LessonPdfUrlResult {
    url: string
    source: 'storage' | 'legacy-url'
    expiresIn: number | null
}

export type AIQuizQuestionStatus = 'pending' | 'approved' | 'rejected'

export interface AIQuizDocument {
    id: string
    parent_id: string
    title: string
    file_url: string
    status: 'processing' | 'completed' | 'error'
    created_at: string
}

export interface AIQuizQuestion {
    id: string
    document_id: string
    quiz_id?: string | null
    question: string
    options: string[]
    correct_index: number
    status: AIQuizQuestionStatus
    created_at?: string
}

export interface AIQuizPlayable {
    document: Pick<AIQuizDocument, 'id' | 'title'> | null
    questions: Pick<AIQuizQuestion, 'id' | 'question' | 'options' | 'correct_index'>[]
}

export type AIAssignmentStatus = 'assigned' | 'completed'

export interface AIAssignment {
    id: string
    document_id: string
    parent_id: string
    child_id: string
    status: AIAssignmentStatus
    assigned_at: string
    completed_at?: string | null
    pdf_documents?: {
        id: string
        title: string
        created_at?: string
    } | null
    profiles?: {
        id: string
        full_name: string | null
        email?: string | null
    } | null
}

export interface SessionStartResult {
    id: string
}

export interface SessionFinishResult {
    reward?: {
        reward_type: 'game' | 'music'
        duration_seconds?: number
    }
}

export interface MiniGamePlayResult {
    entry: {
        id: string
        child_id: string
        game_id: string
        score: number
        accuracy: number
        duration_seconds: number
        stars_earned: number
        played_at: string
    }
    currentStreak: number
    bestStreak: number
    totalStars: number
}

export interface RewardItem {
    id: string
    parent_id: string
    title: string
    description?: string | null
    cost_points: number
    is_active: boolean
    created_at: string
}

export interface RewardRedemption {
    id: string
    reward_item_id?: string | null
    child_id: string
    parent_id: string
    title: string
    cost_points: number
    status: 'requested' | 'approved' | 'fulfilled' | 'rejected'
    requested_at: string
    resolved_at?: string | null
    profiles?: { full_name: string | null } | null
}

export interface MiniGameParentStats {
    totalPlays: number
    avgAccuracy: number
    totalDurationSeconds: number
    totalStars: number
    byGame: Array<{
        gameId: string
        plays: number
        avgScore: number
        avgAccuracy: number
        totalDurationSeconds: number
        totalStars: number
    }>
    byChild: Array<{
        childId: string
        fullName: string | null
        plays: number
        avgScore: number
        avgAccuracy: number
        totalDurationSeconds: number
        totalStars: number
        currentStreak: number
        bestStreak: number
    }>
    bestStreak: number
    currentStreak: number
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
    let attempt = 0
    while (true) {
        const res = await fetch(url, init)
        if (res.status !== 429 || attempt >= retries) return res

        const retryAfter = Number(res.headers.get('retry-after'))
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 400 * Math.pow(2, attempt)

        await sleep(delayMs)
        attempt += 1
    }
}

async function getAuthHeader(): Promise<Record<string, string>> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function requestJson<T>(
    path: string,
    init?: RequestInit,
    options?: { cacheMs?: number; dedupe?: boolean }
): Promise<T> {
    const method = (init?.method || 'GET').toUpperCase()
    const authHeaders = await getAuthHeader()
    const mergedHeaders = { ...authHeaders, ...(init?.headers as Record<string, string> | undefined) }
    const url = `${API_URL}${path}`
    const cacheMs = options?.cacheMs ?? 0
    const dedupe = options?.dedupe ?? true
    const cacheKey = `${method}:${url}:${mergedHeaders.Authorization || ''}`

    if (method === 'GET' && cacheMs > 0) {
        const cached = responseCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T
        }
    }

    if (method === 'GET' && dedupe) {
        const inflight = inflightRequests.get(cacheKey)
        if (inflight) {
            return inflight as Promise<T>
        }
    }

    const requestPromise = (async () => {
        const res = await fetchWithRetry(url, { ...init, method, headers: mergedHeaders })
        if (!res.ok) {
            throw new Error(`Request failed (${res.status}) for ${path}`)
        }

        const data = await res.json()
        if (method === 'GET' && cacheMs > 0) {
            responseCache.set(cacheKey, { expiresAt: Date.now() + cacheMs, data })
        }
        return data as T
    })()

    if (method === 'GET' && dedupe) {
        inflightRequests.set(cacheKey, requestPromise)
    }

    try {
        return await requestPromise
    } finally {
        if (method === 'GET' && dedupe) {
            inflightRequests.delete(cacheKey)
        }
    }
}

function normalizeListResponse<T>(raw: unknown): ApiListResponse<T> {
    if (Array.isArray(raw)) {
        return { data: raw as T[] }
    }

    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
        return { data: (raw as { data: T[] }).data }
    }

    return { data: [] }
}

function normalizeObjectResponse<T>(raw: unknown): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data
    }

    return raw as T
}

export const api = {
    tasks: {
        listForChild: async (childId: string): Promise<ApiListResponse<Task>> => {
            const raw = await requestJson<unknown>(`/tasks/mine?childId=${encodeURIComponent(childId)}`, undefined, { cacheMs: 3000 })
            return normalizeListResponse<Task>(raw)
        },
        get: async (id: string): Promise<Task> => {
            const raw = await requestJson<unknown>(`/tasks/${id}`, undefined, { cacheMs: 3000 })
            return normalizeObjectResponse<Task>(raw)
        },
        create: async (data: Record<string, unknown>) => {
            return requestJson('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
        }
    },
    sessions: {
        start: async (taskId: string, childId: string): Promise<SessionStartResult> => {
            const raw = await requestJson<unknown>('/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, childId })
            })
            return normalizeObjectResponse<SessionStartResult>(raw)
        },
        finish: async (sessionId: string, data: Record<string, unknown>): Promise<SessionFinishResult> => {
            const raw = await requestJson<unknown>(`/sessions/${sessionId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            return normalizeObjectResponse<SessionFinishResult>(raw)
        },
        stats: async (parentId: string) => {
            return requestJson(`/sessions/stats?parentId=${encodeURIComponent(parentId)}`, undefined, { cacheMs: 5000 })
        }
    },
    quizzes: {
        listByLesson: async (lessonId: string): Promise<Quiz[]> => {
            const raw = await requestJson<unknown>(`/quizzes?lessonId=${lessonId}`, undefined, { cacheMs: 10000 })
            if (Array.isArray(raw)) return raw as Quiz[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: Quiz[] }).data
            }
            return []
        }
    },
    subjects: {
        listByGrade: async (grade: number): Promise<ApiListResponse<Subject>> => {
            const raw = await requestJson<unknown>(`/subjects?grade=${grade}`, undefined, { cacheMs: 30000 })
            return normalizeListResponse<Subject>(raw)
        }
    },
    lessons: {
        list: async (): Promise<ApiListResponse<Lesson>> => {
            const raw = await requestJson<unknown>('/lessons', undefined, { cacheMs: 10000 })
            return normalizeListResponse<Lesson>(raw)
        },
        get: async (id: string): Promise<Lesson> => {
            const raw = await requestJson<unknown>(`/lessons/${encodeURIComponent(id)}`, undefined, { cacheMs: 10000 })
            return normalizeObjectResponse<Lesson>(raw)
        },
        getPdfUrl: async (id: string): Promise<LessonPdfUrlResult> => {
            const raw = await requestJson<unknown>(`/lessons/${encodeURIComponent(id)}/pdf-url`, undefined, { cacheMs: 60000 })
            return normalizeObjectResponse<LessonPdfUrlResult>(raw)
        },
        listBySubject: async (subjectId: string): Promise<ApiListResponse<Lesson>> => {
            const raw = await requestJson<unknown>(`/lessons?subjectId=${encodeURIComponent(subjectId)}`, undefined, { cacheMs: 10000 })
            return normalizeListResponse<Lesson>(raw)
        }
    },
    miniGames: {
        play: async (data: {
            childId: string
            gameId: string
            score: number
            accuracy: number
            durationSeconds: number
            starsEarned: number
        }): Promise<MiniGamePlayResult> => {
            const raw = await requestJson<unknown>('/mini-games/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            return normalizeObjectResponse<MiniGamePlayResult>(raw)
        },
        stats: async (parentId: string): Promise<MiniGameParentStats> => {
            const raw = await requestJson<unknown>(`/mini-games/stats?parentId=${encodeURIComponent(parentId)}`, undefined, { cacheMs: 5000 })
            return normalizeObjectResponse<MiniGameParentStats>(raw)
        },
    },
    aiQuizzes: {
        upload: async (title: string, fileUrl: string): Promise<{ documentId: string }> => {
            const raw = await requestJson<unknown>('/ai-quiz/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, fileUrl }),
            })
            return normalizeObjectResponse<{ documentId: string }>(raw)
        },
        listDocuments: async (): Promise<AIQuizDocument[]> => {
            const raw = await requestJson<unknown>('/ai-quiz/documents')
            if (Array.isArray(raw)) return raw as AIQuizDocument[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: AIQuizDocument[] }).data
            }
            return []
        },
        getDocument: async (id: string): Promise<AIQuizDocument> => {
            const raw = await requestJson<unknown>(`/ai-quiz/documents/${id}`)
            return normalizeObjectResponse<AIQuizDocument>(raw)
        },
        listQuestions: async (documentId: string): Promise<AIQuizQuestion[]> => {
            const raw = await requestJson<unknown>(`/ai-quiz/documents/${documentId}/questions`)
            if (Array.isArray(raw)) return raw as AIQuizQuestion[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: AIQuizQuestion[] }).data
            }
            return []
        },
        createQuestion: async (documentId: string, payload: {
            question: string
            options: string[]
            correctIndex: number
            status?: AIQuizQuestionStatus
        }): Promise<AIQuizQuestion> => {
            const raw = await requestJson<unknown>(`/ai-quiz/documents/${documentId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            return normalizeObjectResponse<AIQuizQuestion>(raw)
        },
        updateQuestion: async (questionId: string, payload: {
            question: string
            options: string[]
            correctIndex: number
            status?: AIQuizQuestionStatus
        }): Promise<AIQuizQuestion> => {
            const raw = await requestJson<unknown>(`/ai-quiz/questions/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            return normalizeObjectResponse<AIQuizQuestion>(raw)
        },
        deleteQuestion: async (questionId: string): Promise<{ success: boolean }> => {
            const raw = await requestJson<unknown>(`/ai-quiz/questions/${questionId}`, {
                method: 'DELETE',
            })
            return normalizeObjectResponse<{ success: boolean }>(raw)
        },
        getPlayable: async (documentId: string): Promise<AIQuizPlayable> => {
            const raw = await requestJson<unknown>(`/ai-quiz/documents/${documentId}/playable`)
            const data = normalizeObjectResponse<AIQuizPlayable>(raw)
            return {
                document: data?.document ?? null,
                questions: Array.isArray(data?.questions) ? data.questions : []
            }
        },
        updateQuestionStatus: async (id: string, status: AIQuizQuestionStatus): Promise<AIQuizQuestion> => {
            const raw = await requestJson<unknown>(`/ai-quiz/questions/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            return normalizeObjectResponse<AIQuizQuestion>(raw)
        }
    },
    aiAssignments: {
        create: async (payload: { documentId: string; childId: string }): Promise<AIAssignment> => {
            const raw = await requestJson<unknown>('/ai-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            return normalizeObjectResponse<AIAssignment>(raw)
        },
        listParent: async (filters?: { documentId?: string; childId?: string }): Promise<AIAssignment[]> => {
            const params = new URLSearchParams()
            if (filters?.documentId) params.set('documentId', filters.documentId)
            if (filters?.childId) params.set('childId', filters.childId)
            const path = params.toString() ? `/ai-assignments?${params.toString()}` : '/ai-assignments'
            const raw = await requestJson<unknown>(path)
            if (Array.isArray(raw)) return raw as AIAssignment[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: AIAssignment[] }).data
            }
            return []
        },
        listMine: async (): Promise<AIAssignment[]> => {
            const raw = await requestJson<unknown>('/ai-assignments/mine')
            if (Array.isArray(raw)) return raw as AIAssignment[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: AIAssignment[] }).data
            }
            return []
        },
        markComplete: async (assignmentId: string): Promise<AIAssignment> => {
            const raw = await requestJson<unknown>(`/ai-assignments/${assignmentId}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            })
            return normalizeObjectResponse<AIAssignment>(raw)
        },
    },
    rewards: {
        /** Lấy danh sách quà trong kho (reward_items).
         *  - Nếu truyền childId → lấy quà của parent_id tương ứng bé đó.
         *  - Nếu truyền parentId → lấy tất cả quà của parent này (trang quản lý).
         */
        listStore: async (params: { childId?: string; parentId?: string }): Promise<RewardItem[]> => {
            const qs = new URLSearchParams()
            if (params.childId) qs.set('childId', params.childId)
            if (params.parentId) qs.set('parentId', params.parentId)
            const raw = await requestJson<unknown>(`/reward-store?${qs.toString()}`)
            if (Array.isArray(raw)) return raw as RewardItem[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: RewardItem[] }).data
            }
            return []
        },

        /** Lấy danh sách yêu cầu đổi quà (reward_redemptions).
         *  - childId → lấy lịch sử đổi quà của bé.
         *  - parentId → lấy tất cả yêu cầu đổi quà con của parent.
         */
        listRedemptions: async (params: { childId?: string; parentId?: string }): Promise<RewardRedemption[]> => {
            const qs = new URLSearchParams()
            if (params.childId) qs.set('childId', params.childId)
            if (params.parentId) qs.set('parentId', params.parentId)
            const raw = await requestJson<unknown>(`/reward-redemptions?${qs.toString()}`)
            if (Array.isArray(raw)) return raw as RewardRedemption[]
            if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
                return (raw as { data: RewardRedemption[] }).data
            }
            return []
        },

        /** Bé đổi quà: trừ XP và tạo redemption mới với status='requested'. */
        redeem: async (itemId: string, childId: string): Promise<{ xp: number }> => {
            const raw = await requestJson<unknown>(`/reward-store/${encodeURIComponent(itemId)}/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId }),
            })
            return normalizeObjectResponse<{ xp: number }>(raw)
        },

        /** Bé xác nhận đã nhận quà (fulfilled). */
        fulfillRedemption: async (redemptionId: string, childId: string): Promise<RewardRedemption> => {
            const raw = await requestJson<unknown>(`/reward-redemptions/${encodeURIComponent(redemptionId)}/fulfill`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId }),
            })
            return normalizeObjectResponse<RewardRedemption>(raw)
        },

        /** Ba/mẹ tạo quà mới trong kho. */
        createStoreItem: async (data: {
            parentId: string
            title: string
            description?: string
            costPoints: number
        }): Promise<RewardItem> => {
            const raw = await requestJson<unknown>('/reward-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            return normalizeObjectResponse<RewardItem>(raw)
        },

        /** Ba/mẹ cập nhật quà (ẩn/hiện). */
        updateStoreItem: async (itemId: string, data: { parentId: string; isActive: boolean }): Promise<RewardItem> => {
            const raw = await requestJson<unknown>(`/reward-store/${encodeURIComponent(itemId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            return normalizeObjectResponse<RewardItem>(raw)
        },

        /** Ba/mẹ xóa quà khỏi kho. */
        deleteStoreItem: async (itemId: string, parentId: string): Promise<void> => {
            await requestJson<unknown>(`/reward-store/${encodeURIComponent(itemId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId }),
            })
        },

        /** Ba/mẹ duyệt / từ chối yêu cầu đổi quà. */
        updateRedemptionStatus: async (
            redemptionId: string,
            parentId: string,
            status: 'approved' | 'fulfilled' | 'rejected'
        ): Promise<RewardRedemption> => {
            const raw = await requestJson<unknown>(`/reward-redemptions/${encodeURIComponent(redemptionId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId, status }),
            })
            return normalizeObjectResponse<RewardRedemption>(raw)
        },
    },
}


