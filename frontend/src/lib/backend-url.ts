const LOCAL_BACKEND_FALLBACK = 'http://localhost:4000'

export const BACKEND_API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL || LOCAL_BACKEND_FALLBACK
