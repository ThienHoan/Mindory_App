import Image from 'next/image'
import Link from 'next/link'

type PianoModeCard = {
    title: string
    slug: string
    imageUrl: string
    headerColor: string
    bgClass: string
    borderClass: string
    buttonClass: string
}

const PIANO_MODE_CARDS: PianoModeCard[] = [
    {
        title: 'Học đàn',
        slug: 'creative-sounds',
        imageUrl: 'https://assets.cuthongminh.com/games/mini-piano/group1.webp',
        headerColor: 'text-[#15803d]',
        bgClass: 'from-[#a3e635] to-[#4ade80]',
        borderClass: 'border-[#65a30d]',
        buttonClass: 'from-lime-400 to-green-600 shadow-[0_6px_0_#2f7d32]',
    },
    {
        title: 'Nhạc Công Nhí',
        slug: 'mini-musician',
        imageUrl: 'https://assets.cuthongminh.com/games/mini-piano/group2.webp',
        headerColor: 'text-[#c2410c]',
        bgClass: 'from-[#fdba74] to-[#fb923c]',
        borderClass: 'border-[#ea580c]',
        buttonClass: 'from-orange-400 to-orange-600 shadow-[0_6px_0_#b45309]',
    },
    {
        title: 'Đôi Tai Tinh Anh',
        slug: 'ear-training',
        imageUrl: 'https://assets.cuthongminh.com/games/mini-piano/group3.webp',
        headerColor: 'text-[#7e22ce]',
        bgClass: 'from-[#d8b4fe] to-[#c084fc]',
        borderClass: 'border-[#9333ea]',
        buttonClass: 'from-purple-400 to-purple-600 shadow-[0_6px_0_#6b21a8]',
    },
]

export default function MiniPianoHubPage() {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-6">
            <Image
                src="https://assets.cuthongminh.com/assets/bg.webp"
                alt="Background"
                fill
                sizes="100vw"
                className="object-cover z-0"
            />
            <main className="relative z-10 w-full max-w-6xl mx-auto">
                <div className="mb-8 flex w-full flex-col items-center justify-center pt-4">
                    <div className="relative mb-4 h-24 w-24 md:h-44 md:w-44">
                        <Image
                            src="https://assets.cuthongminh.com/games/mini-piano/logo.webp"
                            alt="Đàn Piano Tí Hon"
                            fill
                            sizes="(max-width: 768px) 96px, 176px"
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-center text-3xl font-black text-orange-500 drop-shadow-sm md:text-6xl">Đàn Piano Tí Hon</h1>
                    <p className="mt-2 text-center text-sm font-bold text-slate-600 md:text-base">Chọn chế độ để bắt đầu học đàn piano nhé!</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-5 transition-opacity duration-300 opacity-100">
                    {PIANO_MODE_CARDS.map((card) => {
                        const isLearningCard = card.slug === 'creative-sounds'
                        const content = (
                            <article
                                className={`group relative flex w-full max-w-[240px] aspect-[3/4] flex-col items-center overflow-hidden rounded-[40px] border-[8px] bg-gradient-to-b p-4 shadow-xl transition-transform hover:scale-105 active:scale-95 ${card.bgClass} ${card.borderClass}`}
                            >
                                <h3 className={`text-center text-2xl md:text-[22px] font-bold uppercase tracking-wider ${card.headerColor}`}>
                                    {card.title}
                                </h3>

                                <div className="flex gap-1 h-10 items-center justify-center">
                                    {isLearningCard ? (
                                        <div className="relative w-10 h-10">
                                            <Image
                                                src="https://assets.cuthongminh.com/games/star.webp"
                                                alt="Hoàn thành"
                                                fill
                                                sizes="40px"
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                <div className="relative w-full flex-1 flex items-center justify-center">
                                    <Image
                                        src={card.imageUrl}
                                        alt={card.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 320px"
                                        className="object-contain drop-shadow-xl"
                                    />
                                </div>

                                <div className={`relative select-none cursor-pointer rounded-full bg-gradient-to-b h-auto w-full flex flex-col items-center justify-center gap-4 py-3 md:py-4 px-4 text-xl md:text-2xl font-extrabold text-white ${card.buttonClass}`}>
                                    BẮT ĐẦU
                                </div>
                            </article>
                        )

                        return (
                            <Link key={card.title} href={`/child/games/mini-piano/${card.slug}`} className="block w-full max-w-[240px]">
                                {content}
                            </Link>
                        )
                    })}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/child/games" className="rounded-full bg-sky-100 px-4 py-2 text-xs font-black text-sky-700 hover:bg-sky-200">
                        ← Quay lại bản đồ trò chơi
                    </Link>
                </div>
            </main>
        </div>
    )
}
