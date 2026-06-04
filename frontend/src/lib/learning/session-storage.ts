export type LearningSessionProgress = {
    sessionId: string | null
    activeSeconds: number
    idleSeconds: number
    studySeconds: number
    quizSeconds: number
    breakSeconds: number
    gameBreakSeconds: number
    updatedAt: number
}

const LEARNING_SESSION_PREFIX = 'mindory:learning-session:'

function emptyProgress(): LearningSessionProgress {
    return {
        sessionId: null,
        activeSeconds: 0,
        idleSeconds: 0,
        studySeconds: 0,
        quizSeconds: 0,
        breakSeconds: 0,
        gameBreakSeconds: 0,
        updatedAt: Date.now(),
    }
}

function safeNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

export function getLearningSessionKey(taskId: string) {
    return `${LEARNING_SESSION_PREFIX}${taskId}`
}

export function loadLearningSessionProgress(taskId: string): LearningSessionProgress | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(getLearningSessionKey(taskId))
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<LearningSessionProgress>
        return {
            sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
            activeSeconds: safeNumber(parsed.activeSeconds),
            idleSeconds: safeNumber(parsed.idleSeconds),
            studySeconds: safeNumber(parsed.studySeconds),
            quizSeconds: safeNumber(parsed.quizSeconds),
            breakSeconds: safeNumber(parsed.breakSeconds),
            gameBreakSeconds: safeNumber(parsed.gameBreakSeconds),
            updatedAt: safeNumber(parsed.updatedAt) || Date.now(),
        }
    } catch {
        return null
    }
}

export function saveLearningSessionProgress(taskId: string, progress: Partial<LearningSessionProgress>) {
    if (typeof window === 'undefined') return

    const previous = loadLearningSessionProgress(taskId) ?? emptyProgress()
    const next: LearningSessionProgress = {
        sessionId: progress.sessionId !== undefined ? progress.sessionId : previous.sessionId,
        activeSeconds: progress.activeSeconds ?? previous.activeSeconds,
        idleSeconds: progress.idleSeconds ?? previous.idleSeconds,
        studySeconds: progress.studySeconds ?? previous.studySeconds,
        quizSeconds: progress.quizSeconds ?? previous.quizSeconds,
        breakSeconds: progress.breakSeconds ?? previous.breakSeconds,
        gameBreakSeconds: progress.gameBreakSeconds ?? previous.gameBreakSeconds,
        updatedAt: Date.now(),
    }

    try {
        window.localStorage.setItem(getLearningSessionKey(taskId), JSON.stringify(next))
    } catch {
        // Keep learning flow usable even when storage is blocked.
    }
}

export function clearLearningSessionProgress(taskId: string) {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.removeItem(getLearningSessionKey(taskId))
    } catch {
        // Ignore storage failures.
    }
}
