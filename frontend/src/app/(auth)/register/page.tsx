'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AuthSplitCard from '@/components/auth/AuthSplitCard'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(null)

    if (!fullName || !email || !password) return
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'parent',
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/login?message=Check your email to confirm account')
    }
  }

  return (
    <AuthSplitCard title="Đăng Ký" subtitle="Tạo tài khoản miễn phí - chỉ 10 giây!">
      <div className="mb-6 space-y-3">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white py-3 font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a6 6 0 0 1-2.21 3.31v2.77h3.57a10.8 10.8 0 0 0 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.4 6.4 0 0 1-3.71 1.06c-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09A6.9 6.9 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1c-4.3 0-8.01 2.47-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng ký bằng Google
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">hoặc bằng email</span>
        </div>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleRegister}>
        <div className="space-y-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-3.5 text-red-400">
              👤
            </span>
            <input
              id="full-name"
              name="fullName"
              type="text"
              className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-12 pr-4 text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="Họ và tên phụ huynh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {submitted && !fullName && (
            <div className="ml-1 text-xs font-semibold text-red-500">Vui lòng nhập họ và tên</div>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-3.5 text-red-400">
              ✉️
            </span>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-12 pr-4 text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="Email của bố mẹ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {submitted && !email && (
            <div className="ml-1 text-xs font-semibold text-red-500">Vui lòng nhập email</div>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-3.5 text-red-400">
              🔒
            </span>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-12 pr-4 text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {submitted && !password && (
            <div className="ml-1 text-xs font-semibold text-red-500">Vui lòng nhập mật khẩu</div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
        )}

        <button
          className="mt-2 inline-flex h-16 w-full items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-12 py-4 text-xl font-extrabold uppercase tracking-wider text-white shadow-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl active:translate-y-1 active:brightness-95 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}
        </button>
        <p className="mt-1 text-center text-xs font-medium text-slate-400">
          ✅ Miễn phí • 🔒 An toàn cho bé • 🎮 1,000+ phụ huynh tin dùng
        </p>
      </form>

      <div className="mt-6 text-center">
        <p className="font-medium text-gray-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-bold text-[#D97706] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthSplitCard>
  )
}
