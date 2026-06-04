export const DEFAULT_FREE_QUIZ_SECONDS = 10 * 60
export const DEFAULT_FOCUS_INTERVAL_SECONDS = 5 * 60
export const DEFAULT_BREAK_SECONDS = 30
export const DEFAULT_GAME_BREAK_SECONDS = 60
export const DEFAULT_ASSIGNED_QUIZ_GAME_BREAK_SECONDS = 45
export const DEFAULT_MIN_ACTIVE_BEFORE_QUIZ_SECONDS = 5 * 60

export type SessionMode = 'study' | 'free-quiz' | 'assigned-quiz'

export type SessionPolicy = {
    sessionTotalSeconds: number
    focusIntervalSeconds: number
    breakSeconds: number
    gameBreakSeconds: number
    assignedQuizGameBreakSeconds: number
    minActiveBeforeQuizSeconds: number
    allowGameBreak: boolean
    gameBreakCountsAsReward: boolean
}

type BuildSessionPolicyInput = {
    durationMinutes?: number | null
    assigned?: boolean
    mode?: SessionMode
}

function durationToSeconds(durationMinutes?: number | null) {
    if (!durationMinutes || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return DEFAULT_FREE_QUIZ_SECONDS
    }

    return Math.round(durationMinutes * 60)
}

export function buildSessionPolicy({ durationMinutes, assigned = false, mode }: BuildSessionPolicyInput): SessionPolicy {
    const effectiveMode: SessionMode = mode ?? (assigned ? 'assigned-quiz' : 'free-quiz')
    const isAssignedQuiz = effectiveMode === 'assigned-quiz'
    const sessionTotalSeconds = durationToSeconds(durationMinutes)

    return {
        sessionTotalSeconds,
        focusIntervalSeconds: Math.min(DEFAULT_FOCUS_INTERVAL_SECONDS, sessionTotalSeconds),
        breakSeconds: DEFAULT_BREAK_SECONDS,
        gameBreakSeconds: isAssignedQuiz ? DEFAULT_ASSIGNED_QUIZ_GAME_BREAK_SECONDS : DEFAULT_GAME_BREAK_SECONDS,
        assignedQuizGameBreakSeconds: DEFAULT_ASSIGNED_QUIZ_GAME_BREAK_SECONDS,
        minActiveBeforeQuizSeconds: Math.min(DEFAULT_MIN_ACTIVE_BEFORE_QUIZ_SECONDS, sessionTotalSeconds),
        allowGameBreak: true,
        gameBreakCountsAsReward: !isAssignedQuiz,
    }
}

export const defaultSessionPolicy = buildSessionPolicy({ mode: 'free-quiz' })

const sessionPolicyConfig = {
    DEFAULT_FREE_QUIZ_SECONDS,
    DEFAULT_FOCUS_INTERVAL_SECONDS,
    DEFAULT_BREAK_SECONDS,
    DEFAULT_GAME_BREAK_SECONDS,
    DEFAULT_ASSIGNED_QUIZ_GAME_BREAK_SECONDS,
    DEFAULT_MIN_ACTIVE_BEFORE_QUIZ_SECONDS,
    buildSessionPolicy,
    defaultSessionPolicy,
}

export default sessionPolicyConfig
