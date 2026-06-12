const LOCAL_BACKEND_FALLBACK = 'http://localhost:4000'

const rawBackendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    LOCAL_BACKEND_FALLBACK

export const BACKEND_API_URL = rawBackendUrl.replace(/\/+$/, '')