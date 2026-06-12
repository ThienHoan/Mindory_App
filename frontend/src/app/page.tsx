'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type GameCategory = {
  title: string
  desc: string
  href: string
  image: string
  gradient: string
}

type BlogPost = {
  title: string
  excerpt: string
  href: string
  image: string
  minutes: number
  date: string
}

const gameCategories: GameCategory[] = [
  {
    title: 'Tư Duy',
    desc: 'Rèn luyện tư duy logic qua mê cung, tìm điểm khác biệt và nối điểm.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/tu_duy.webp',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    title: 'Mỹ Thuật',
    desc: 'Nhận biết màu sắc, tô tranh và phát triển sáng tạo cho bé.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/ve.webp',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    title: 'Kỹ Năng Sống',
    desc: 'Tập kỹ năng sống thiết yếu với tình huống tương tác trực quan.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/ky_nang_song.webp',
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    title: 'Địa Lý Tự Nhiên',
    desc: 'Khám phá cờ quốc gia, địa danh và thế giới quanh bé.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/dia_ly.webp',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    title: 'Âm Nhạc',
    desc: 'Làm quen nhịp điệu, nốt nhạc và ghi nhớ giai điệu vui nhộn.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/am_nhac.webp',
    gradient: 'from-indigo-400 to-indigo-600',
  },
  {
    title: 'Khoa Học',
    desc: 'Học về động vật, cơ thể, thiên nhiên qua trò chơi khám phá.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/khoa_hoc.webp',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    title: 'Ngôn Ngữ',
    desc: 'Học bảng chữ cái, dấu thanh và ghép vần theo lộ trình.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/ngon_ngu.webp',
    gradient: 'from-red-400 to-red-600',
  },
  {
    title: 'Toán Học',
    desc: 'Đếm số, so sánh, cộng trừ và toán tư duy cho trẻ mầm non.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/home/toan.webp',
    gradient: 'from-teal-400 to-teal-600',
  },
  {
    title: 'Tiếng Anh',
    desc: 'Từ vựng và phát âm tiếng Anh bằng hình ảnh và trò chơi.',
    href: '/games',
    image: 'https://assets.cuthongminh.com/games/learn-english-vocab/tieng_anh.webp',
    gradient: 'from-sky-400 to-sky-600',
  },
]

const blogPosts: BlogPost[] = [
  {
    title: 'Giáo Dục STEAM Cho Trẻ Mầm Non',
    excerpt: '5 dự án STEAM dễ làm tại nhà giúp bé phát triển tư duy khoa học và sáng tạo.',
    href: '#',
    image: 'https://vnlppyavpkuerviyszxg.supabase.co/storage/v1/object/public/blog-images/steam_preschool_featured_1779433552203-1779433591447.webp',
    minutes: 13,
    date: '20 tháng 5, 2026',
  },
  {
    title: 'Kiểm Soát Screen Time Lành Mạnh',
    excerpt: 'Mẹo giúp phụ huynh quản lý thời gian thiết bị cho bé mà không căng thẳng.',
    href: '#',
    image: 'https://vnlppyavpkuerviyszxg.supabase.co/storage/v1/object/public/blog-images/screen_time_kids_1779281954835-1779281962688.webp',
    minutes: 13,
    date: '20 tháng 5, 2026',
  },
  {
    title: 'Dạy Bé Xem Đồng Hồ Theo Độ Tuổi',
    excerpt: 'Lộ trình từng bước giúp trẻ 3-7 tuổi làm chủ kỹ năng xem giờ.',
    href: '#',
    image: 'https://vnlppyavpkuerviyszxg.supabase.co/storage/v1/object/public/blog-images/hero_dong_ho-1773806889687.webp',
    minutes: 19,
    date: '20 tháng 5, 2026',
  },
  {
    title: '7 Phương Pháp Học Qua Trò Chơi',
    excerpt: 'Ứng dụng play-based learning để con học chủ động và nhớ lâu hơn.',
    href: '#',
    image: 'https://vnlppyavpkuerviyszxg.supabase.co/storage/v1/object/public/blog-images/hoc_qua_choi_hero_1776908831558-1776908844630.webp',
    minutes: 25,
    date: '20 tháng 5, 2026',
  },
]

const testimonials = [
  {
    quote:
      'Nhờ có Cú Thông Minh, hai bé nhà mình hào hứng học toán hơn hẳn. Mỗi tối đều đòi chơi thêm.',
    name: 'Mẹ Thúy Hạnh',
    role: 'Phụ huynh bé 4 & 6 tuổi',
  },
  {
    quote:
      'Mình thích nhất là nội dung sạch, không quảng cáo. Bé học rất tập trung và vui vẻ.',
    name: 'Ba Minh Quân',
    role: 'Phụ huynh bé 5 tuổi',
  },
  {
    quote:
      'Bé nhận diện chữ cái nhanh hơn chỉ sau vài tuần học bằng trò chơi tương tác.',
    name: 'Mẹ Hoài An',
    role: 'Phụ huynh bé 3 tuổi',
  },
]

const faqs = [
  {
    q: 'Cú Thông Minh là gì?',
    a: 'Là nền tảng trò chơi giáo dục tương tác cho trẻ 3-8 tuổi với nội dung toán, ngôn ngữ, tư duy và kỹ năng sống.',
  },
  {
    q: 'Ứng dụng có miễn phí không?',
    a: 'Có gói trải nghiệm miễn phí và gói mở rộng nội dung nâng cao để phụ huynh lựa chọn.',
  },
  {
    q: 'Có an toàn cho trẻ không?',
    a: 'Nội dung hướng đến trẻ em, không quảng cáo độc hại, tập trung môi trường học tập tích cực.',
  },
  {
    q: 'Dùng trên thiết bị nào?',
    a: 'Dùng trực tiếp trên trình duyệt điện thoại, tablet và máy tính, không cần cài đặt.',
  },
]

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  name: 'Cú Thông Minh',
  url: 'https://cuthongminh.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://cuthongminh.com/icons/android-chrome-512x512.png',
    width: '512',
    height: '512',
  },
  description:
    'Cú Thông Minh là nền tảng giáo dục tương tác cho trẻ em từ 3-8 tuổi, giúp bé vừa học vừa chơi qua hàng trăm trò chơi trí tuệ.',
  areaServed: {
    '@type': 'Country',
    name: 'Vietnam',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cú Thông Minh',
  url: 'https://cuthongminh.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://cuthongminh.com/games?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Cú Thông Minh',
  url: 'https://cuthongminh.com',
  description:
    'Ứng dụng giáo dục tương tác giúp bé vừa học vừa chơi, phát triển tư duy toán học và ngôn ngữ qua các trò chơi trực quan.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'VND',
  },
}

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [scrolled, setScrolled] = useState(false)
  const [owlPos, setOwlPos] = useState({ x: 16, y: 0 })
  const [owlDragging, setOwlDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const owlSizeRef = useRef(110)
  const [authUrl, setAuthUrl] = useState('/register')

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const role = user.user_metadata?.role || user.app_metadata?.role
        if (role === 'child') {
          setAuthUrl('/child')
        } else if (role === 'admin') {
          setAuthUrl('/admin')
        } else {
          setAuthUrl('/parent')
        }
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const initialY = Math.max(16, window.innerHeight - 170)
    setOwlPos({ x: 16, y: initialY })
  }, [])

  useEffect(() => {
    if (!owlDragging) return
    const onMove = (event: PointerEvent) => {
      const size = owlSizeRef.current
      const x = Math.min(Math.max(8, event.clientX - dragOffsetRef.current.x), window.innerWidth - size - 8)
      const y = Math.min(Math.max(8, event.clientY - dragOffsetRef.current.y), window.innerHeight - size - 8)
      setOwlPos({ x, y })
    }
    const onUp = () => setOwlDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [owlDragging])

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur py-3' : 'bg-transparent py-4 pt-6'}`}
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://assets.cuthongminh.com/assets/logo-long.webp"
              alt="Cú Thông Minh"
              width={220}
              height={48}
              className="hidden md:block"
            />
            <Image
              src="https://assets.cuthongminh.com/assets/logo.webp"
              alt="Cú Thông Minh"
              width={48}
              height={48}
              className="md:hidden"
            />
          </Link>
          <Link
            href={authUrl}
            className="rounded-full bg-[#FF9C01] px-6 py-3 font-bold text-slate-900 shadow-[0_4px_14px_0_rgba(255,156,1,0.39)] transition-all hover:-translate-y-0.5 hover:bg-orange-500"
          >
            Bắt đầu học
          </Link>
        </div>
      </nav>

      <main className="pt-[72px]">
        <header className="relative overflow-hidden pb-32 pt-20 lg:pb-40 lg:pt-32">
          <div className="animate-blob absolute left-10 top-20 hidden h-72 w-72 rounded-full bg-yellow-200 opacity-50 blur-3xl mix-blend-multiply md:block" />
          <div className="animate-blob animation-delay-2000 absolute right-10 top-40 hidden h-72 w-72 rounded-full bg-orange-200 opacity-50 blur-3xl mix-blend-multiply md:block" />
          <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-1/3 hidden h-72 w-72 rounded-full bg-pink-200 opacity-50 blur-3xl mix-blend-multiply md:block" />

          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="mb-10 inline-flex cursor-default items-center gap-2 rounded-full border border-orange-200/60 bg-orange-100 px-5 py-2.5 text-sm font-bold text-orange-600">
              <span>📘</span>
              <span>Nền tảng học mà chơi số 1 cho bé</span>
            </div>
            <h1 className="mx-auto mb-8 max-w-5xl text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-7xl lg:text-[5rem]">
              Trò Chơi Giáo Dục <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Tương Tác Cho Bé 6-12 Tuổi
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl">
              Cú Thông Minh là nền tảng học tập dành cho trẻ mẫu giáo giúp trẻ học chữ cái,
              số đếm, màu sắc và hình học thông qua các trò chơi tương tác.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={authUrl}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FF9C01] px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_8px_30px_rgb(255,156,1,0.3)] transition-all hover:-translate-y-1 hover:bg-orange-500 sm:w-auto"
              >
                Trải nghiệm ngay <span>→</span>
              </Link>
              <a
                href="#games"
                className="flex w-full items-center justify-center gap-3 rounded-full border border-b-4 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50 sm:w-auto"
              >
                Khám phá Kho bài học
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-500">
              <span>✅ Miễn phí trải nghiệm</span>
              <span>🛡️ An toàn cho bé</span>
              <span>✨ Không cần tải app</span>
            </div>
          </div>

          <div className="container relative z-10 mx-auto mt-16 px-6">
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              <Stat title="20+" desc="Thể loại trò chơi" icon="🎮" />
              <Stat title="1,000+" desc="Phụ huynh tin dùng" icon="👨‍👩‍👧‍👦" />
              <Stat title="4.9/5" desc="Đánh giá" icon="⭐" />
              <Stat title="100%" desc="An toàn, không QC" icon="🛡️" />
            </div>
          </div>
        </header>

        <section
          id="features"
          className="relative z-20 rounded-t-[3rem] bg-white py-24 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.03)]"
        >
          <div className="container mx-auto px-6">
            <div className="mb-20 text-center">
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Lợi ích khi là <span className="text-orange-500">Cú Thông Minh</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
                Ứng dụng được thiết kế kỹ lưỡng dựa trên phương pháp giáo dục sớm, phù hợp với
                tâm lý trẻ nhỏ.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
              <FeatureCard
                icon="🧠"
                title="Phát triển toàn diện"
                desc="Rèn luyện tư duy, toán học, ngôn ngữ và kỹ năng giải quyết vấn đề qua các hoạt động trực quan."
              />
              <FeatureCard
                icon="💗"
                title="Tương tác thú vị"
                desc="Hình ảnh sống động và phản hồi tích cực giúp bé hứng thú học tập mỗi ngày."
                highlighted
              />
              <FeatureCard
                icon="🛡️"
                title="Môi trường an toàn"
                desc="Không quảng cáo gây nhiễu, không nội dung độc hại, phụ huynh theo dõi tiến độ rõ ràng."
              />
            </div>
          </div>
        </section>

        <section
          id="games"
          className="relative mx-2 my-8 overflow-hidden rounded-[3rem] bg-slate-900 py-24 shadow-2xl lg:mx-8"
        >
          <div className="absolute inset-0 bg-[url('/globe.svg')] opacity-[0.03]" />
          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-white/90 backdrop-blur-md">
              🏆 Kho tàng tri thức
            </div>
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Thế giới giải trí bất tận
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 md:text-xl">
              Hơn 20+ thể loại trò chơi từ thế giới muôn loài, đồ vật, học chữ cái đến rèn luyện
              khả năng tính toán.
            </p>

            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
              {gameCategories.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`group relative flex h-auto min-h-[15rem] flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg transition-transform duration-300 hover:scale-[1.03] ${item.gradient}`}
                >
                  <div className="absolute inset-0 transition-colors group-hover:bg-black/10" />
                  <div className="relative mb-4 h-16 w-16 drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 sm:h-20 sm:w-20">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-contain" />
                  </div>
                  <span className="mb-2 text-center text-xl font-bold leading-tight sm:text-2xl">{item.title}</span>
                  <p className="hidden text-center text-sm font-medium leading-relaxed text-white/95 md:block">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-16">
              <Link
                href="/games"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-10 py-4 text-lg font-extrabold text-slate-900 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-colors hover:bg-slate-100"
              >
                Học thử ngay <span className="text-orange-500">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="relative bg-white py-24">
          <div className="container mx-auto px-6">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Góc Chia Sẻ <span className="text-orange-500">Kinh Nghiệm</span>
                </h2>
                <p className="text-lg font-medium leading-relaxed text-slate-500">
                  Khám phá những bài viết mới nhất về phương pháp giáo dục sớm và kinh nghiệm
                  nuôi dạy trẻ tại nhà.
                </p>
              </div>
              <Link href="#" className="text-lg font-bold text-orange-500 transition-colors hover:text-orange-600">
                Xem tất cả bài viết →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {blogPosts.map((post) => (
                <article
                  key={post.title}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 transition-all duration-300 hover:border-orange-200 hover:bg-white hover:shadow-xl"
                >
                  <Link href={post.href} className="flex flex-1 flex-col">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-8">
                      <div className="mb-4 flex items-center gap-4 text-sm font-medium text-slate-500">
                        <time>{post.date}</time>
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-1">{post.minutes} phút đọc</span>
                      </div>
                      <h3 className="mb-3 text-2xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-500">
                        {post.title}
                      </h3>
                      <p className="line-clamp-3 flex-1 leading-relaxed text-slate-600">{post.excerpt}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-slate-100 bg-slate-50 py-24">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 font-bold text-orange-600">
                ⭐ Phương pháp học tập
              </div>
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Phương pháp <span className="text-orange-500">Giáo dục sớm</span> tại Cú Thông Minh
              </h2>
            </div>

            <div className="flex flex-col gap-8 md:gap-12">
              <MethodCard
                title="Lấy cảm hứng từ Montessori & Play-based Learning"
                desc1="Triết lý vừa học vừa chơi giúp trẻ chủ động khám phá trong môi trường tích cực, an toàn và đầy hứng thú."
                desc2="Lộ trình được chia theo độ tuổi 3-8, từ nhận biết cơ bản đến tư duy logic và toán học nâng cao."
                icon="🧠"
                tone="orange"
              />
              <MethodCard
                title="Môi trường học tập chủ động và an toàn"
                desc1="Bé tương tác liên tục qua kéo thả, ghép nối, lựa chọn và phản hồi thay vì xem thụ động."
                desc2="Hệ thống không quảng cáo, phụ huynh dễ theo dõi tiến độ và quản lý thời gian học tập."
                icon="🛡️"
                tone="green"
                reverse
              />
            </div>
          </div>
        </section>

        <section className="relative bg-white py-24">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Phụ huynh nói gì về <span className="text-orange-500">Cú Thông Minh</span>?
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
                Hàng ngàn gia đình đã tin dùng nền tảng để đồng hành cùng bé mỗi ngày.
              </p>
            </div>

            <div className="group relative rounded-[3rem] border border-orange-100 bg-orange-50 p-8 text-center shadow-sm lg:p-16">
              <div className="relative z-10 min-h-[180px]">
                <div className="mb-6 text-2xl text-[#FF9C01]">✅ ✅ ✅ ✅ ✅</div>
                <h3 className="mx-auto mb-8 max-w-4xl px-4 text-xl italic leading-relaxed text-slate-800 md:px-12 md:text-3xl">
                  "{testimonials[activeTestimonial].quote}"
                </h3>
                <div>
                  <p className="mb-1 text-lg font-extrabold text-slate-900">{testimonials[activeTestimonial].name}</p>
                  <p className="inline-block rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-600">
                    {testimonials[activeTestimonial].role}
                  </p>
                </div>
              </div>
              <div className="relative z-20 mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-orange-100 bg-white text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
                  onClick={() =>
                    setActiveTestimonial(
                      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
                    )
                  }
                >
                  ←
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTestimonial(idx)}
                      className={`h-3 rounded-full transition-all ${idx === activeTestimonial ? 'w-8 bg-orange-500' : 'w-3 bg-orange-200 hover:bg-orange-300'}`}
                      aria-label={`Chuyển đến nhận xét ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="h-10 w-10 rounded-full border border-orange-100 bg-white text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
                  onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#FF9C01] to-orange-500 py-24">
          <div className="container relative z-10 mx-auto px-6 text-center text-white">
            <h2 className="mb-8 text-4xl font-extrabold tracking-tight drop-shadow-md md:text-6xl">
              Khơi dậy tiềm năng cùng bé
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-white/90 md:text-2xl">
              Tham gia cộng đồng phụ huynh tin dùng Cú Thông Minh để mang đến tương lai tươi sáng cho con bạn.
            </p>
            <Link
              href={authUrl}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-10 py-5 text-lg font-bold text-slate-900 shadow-xl transition-all hover:scale-105 sm:w-auto md:text-xl"
            >
              Đăng ký tài khoản miễn phí
            </Link>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-white/80">
              <div>✅ Chương trình đã được kiểm duyệt</div>
              <div>✅ Không lo gián đoạn bởi quảng cáo</div>
              <div>✅ Sử dụng đa nền tảng</div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-gradient-to-b from-white to-orange-50/30 py-24">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Câu hỏi thường gặp</h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
                Những thắc mắc phổ biến của phụ huynh về Cú Thông Minh
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={item.q}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left"
                      onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
                    >
                      <span className="text-lg font-bold text-slate-900">{item.q}</span>
                      <span className={`text-orange-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="px-6 pb-6 leading-relaxed text-slate-600">{item.a}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-100 bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="mb-12 flex flex-col items-start justify-between gap-12 md:flex-row">
            <div className="max-w-xs text-center md:text-left">
              <Image
                src="https://assets.cuthongminh.com/assets/logo-long.webp"
                alt="Cú Thông Minh"
                width={220}
                height={48}
                className="mx-auto mb-6 md:mx-0"
              />
              <p className="text-sm leading-relaxed text-slate-500">
                Nền tảng học mà chơi số 1 cho bé, giúp con phát triển tư duy toàn diện qua những bài học sáng tạo.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-10 md:w-auto md:grid-cols-4">
              <FooterGroup
                title="Khám phá"
                links={['Giới thiệu', 'Blog giáo dục mầm non', 'Kho trò chơi', 'Nâng cấp Premium']}
              />
              <FooterGroup
                title="Theo độ tuổi"
                links={['Bé 3 tuổi', 'Bé 4 tuổi', 'Bé 5 tuổi', 'Bé 6-8 tuổi']}
              />
              <FooterGroup
                title="Môn học"
                links={['Tư duy', 'Mỹ thuật', 'Kỹ năng sống', 'Toán học']}
              />
              <FooterGroup
                title="Hỗ trợ"
                links={['Góp ý', 'Chính sách bảo mật', 'Điều khoản sử dụng']}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs font-medium text-slate-400 md:flex-row">
            <p>© 2026 Cú Thông Minh Educational. All rights reserved.</p>
            <p>Mỗi bài học là một nụ cười cho con.</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-[80] border-t border-slate-200 bg-white/90 p-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <Link
          href={authUrl}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF9C01] py-3.5 text-base font-bold text-slate-900 shadow-[0_4px_14px_0_rgba(255,156,1,0.39)] transition-all active:scale-[0.98]"
        >
          Trải nghiệm ngay <span>→</span>
        </Link>
      </div>

      <a
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat với chúng tôi qua Messenger"
        href="https://www.facebook.com/messages/t/1034628276400741"
        className="fixed bottom-20 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#00c6ff] to-[#0072ff] text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-xl md:bottom-6 md:right-6"
      >
        <span className="text-2xl">💬</span>
        <span className="absolute right-0 top-0 flex h-3.5 w-3.5 pt-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        </span>
      </a>

      <div
        className={`fixed z-50 ${owlDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ left: owlPos.x, top: owlPos.y, userSelect: 'none', touchAction: 'none' }}
        onPointerDown={(event) => {
          const target = event.currentTarget.getBoundingClientRect()
          dragOffsetRef.current = {
            x: event.clientX - target.left,
            y: event.clientY - target.top,
          }
          owlSizeRef.current = target.width
          setOwlDragging(true)
        }}
      >
        <div className="relative h-20 w-20 transition-transform duration-300 md:h-32 md:w-32">
          <Image
            src="https://assets.cuthongminh.com/assets/own-learning.webp"
            alt="Owl Companion"
            fill
            draggable={false}
            sizes="(max-width: 768px) 80px, 128px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-center gap-1">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-extrabold text-slate-900 md:text-3xl">{title}</span>
      </div>
      <p className="text-xs font-semibold text-slate-500 md:text-sm">{desc}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
  highlighted = false,
}: {
  icon: string
  title: string
  desc: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-50 p-10 transition-all duration-300 hover:-translate-y-2 hover:border-orange-200 hover:bg-orange-50 hover:shadow-xl ${highlighted ? 'md:-translate-y-6' : ''}`}
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-4 text-2xl font-bold text-slate-900">{title}</h3>
      <p className="font-medium leading-relaxed text-slate-600">{desc}</p>
    </div>
  )
}

function MethodCard({
  title,
  desc1,
  desc2,
  icon,
  tone,
  reverse = false,
}: {
  title: string
  desc1: string
  desc2: string
  icon: string
  tone: 'orange' | 'green'
  reverse?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md md:p-12 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} md:gap-12`}
    >
      <div className="flex-1">
        <h3 className="mb-4 text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mb-4 text-lg leading-relaxed text-slate-600">{desc1}</p>
        <p className="text-lg leading-relaxed text-slate-600">{desc2}</p>
      </div>
      <div
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full md:h-56 md:w-56 ${tone === 'orange' ? 'bg-orange-50' : 'bg-green-50'}`}
      >
        <span className="text-6xl md:text-7xl">{icon}</span>
      </div>
    </div>
  )
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="mb-2 font-bold text-slate-900">{title}</h4>
      {links.map((item) => (
        <Link key={item} href="#" className="text-sm text-slate-500 transition-colors hover:text-[#FF9C01]">
          {item}
        </Link>
      ))}
    </div>
  )
}
