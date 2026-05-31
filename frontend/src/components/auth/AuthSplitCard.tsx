import type { ReactNode } from 'react'
import Image from 'next/image'
import FloatingOwl from '@/components/auth/FloatingOwl'

type AuthSplitCardProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthSplitCard({ title, subtitle, children }: AuthSplitCardProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sky-100 p-4 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:20px_20px]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-orange-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-sky-200/70 blur-3xl" />

      <div className="z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-white/50 bg-white shadow-2xl backdrop-blur-sm md:flex-row">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-purple-50 p-8 md:w-1/2">
          <div className="absolute inset-0 bg-[url('https://assets.cuthongminh.com/assets/bg.jpg')] bg-cover opacity-10" />
          <div className="relative z-10 text-center">
            <Image
              src="https://assets.cuthongminh.com/games/common/owl-say-hi.webp"
              alt="Owl Companion"
              width={280}
              height={280}
              className="ctm-float mx-auto w-[200px] transform drop-shadow-2xl transition-transform duration-300 hover:scale-105 md:w-[280px]"
              priority
            />
          </div>
        </div>

        <div className="relative flex flex-col justify-center bg-white p-8 md:w-1/2 md:p-12">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-4xl font-extrabold text-[#D97706] drop-shadow-sm">{title}</h1>
            <p className="font-medium text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      <FloatingOwl />
    </main>
  )
}
