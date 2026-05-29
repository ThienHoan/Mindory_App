'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MINI_MUSICIAN_SONGS, RAINBOW_PIANO_KEYS, RainbowPianoKey } from '../data'

type PianoMode = 'creative-sounds' | 'mini-musician' | 'ear-training'
const CREATIVE_MIN_NOTES = 14

function usePianoAudio() {
    const audioRef = useRef<AudioContext | null>(null)

    const ensureContext = useCallback(async () => {
        if (typeof window === 'undefined') return null
        if (!audioRef.current || audioRef.current.state === 'closed') {
            audioRef.current = new window.AudioContext()
        }
        if (audioRef.current.state === 'suspended') {
            await audioRef.current.resume()
        }
        return audioRef.current
    }, [])

    const playFrequency = useCallback(async (freq: number, duration = 0.42, gainValue = 0.17) => {
        const ctx = await ensureContext()
        if (!ctx) return

        const oscMain = ctx.createOscillator()
        const oscHarm = ctx.createOscillator()
        const gain = ctx.createGain()

        oscMain.type = 'sine'
        oscMain.frequency.value = freq
        oscHarm.type = 'triangle'
        oscHarm.frequency.value = freq * 2

        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

        oscMain.connect(gain)
        oscHarm.connect(gain)
        gain.connect(ctx.destination)

        oscMain.start()
        oscHarm.start()
        oscMain.stop(ctx.currentTime + duration)
        oscHarm.stop(ctx.currentTime + duration)
    }, [ensureContext])

    const playError = useCallback(async () => {
        const ctx = await ensureContext()
        if (!ctx) return

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.value = 190
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.22)
    }, [ensureContext])

    return { playFrequency, playError }
}

function PianoBoard({
    activeKeyId,
    pulseKeyId,
    onPress,
    disabled,
}: {
    activeKeyId: string | null
    pulseKeyId: string | null
    onPress: (key: RainbowPianoKey) => void
    disabled?: boolean
}) {
    return (
        <div className="rounded-[1.5rem] border-t-[6px] border-[#333] bg-[#4a4a4a] p-2 shadow-2xl sm:rounded-[2rem] sm:border-t-[10px] sm:p-8">
            <div className="flex justify-center gap-0.5 sm:gap-2">
                {RAINBOW_PIANO_KEYS.map((key) => (
                    <button
                        key={key.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onPress(key)}
                        className={cn(
                            'relative flex h-[220px] min-w-0 flex-1 flex-col items-center justify-end rounded-b-2xl pb-4 shadow-[inset_0_-8px_10px_rgba(0,0,0,0.1),0_10px_15px_rgba(0,0,0,0.1)] transition-all duration-100 hover:brightness-105 [@media(min-width:376px)]:h-[280px] sm:h-[350px] sm:pb-8',
                            key.colorClass,
                            pulseKeyId === key.id && 'z-10 scale-105 animate-pulse ring-8 ring-inset ring-white',
                            activeKeyId === key.id && '-translate-y-1 brightness-110 ring-4 ring-white/70',
                            disabled && 'cursor-not-allowed opacity-90'
                        )}
                    >
                        <div className="z-20 mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/30 backdrop-blur-sm shadow-sm [@media(min-width:376px)]:h-12 [@media(min-width:376px)]:w-12 sm:mb-4 sm:h-16 sm:w-16">
                            <span className="select-none text-lg font-black leading-none text-white drop-shadow-md [@media(min-width:376px)]:text-xl sm:text-2xl">
                                {key.displayLabel}
                            </span>
                        </div>
                        <div className="absolute left-0 top-0 h-8 w-full rounded-t-sm bg-black/10" />
                    </button>
                ))}
            </div>
        </div>
    )
}

function CreativeSoundsView() {
    const router = useRouter()
    const { playFrequency } = usePianoAudio()
    const [activeKeyId, setActiveKeyId] = useState<string | null>(null)
    const [message, setMessage] = useState('Bé chạm vào các phím màu để học nốt piano nhé!')
    const [notesPlayed, setNotesPlayed] = useState(0)
    const [completedPopupOpen, setCompletedPopupOpen] = useState(false)
    const [hasCompleted, setHasCompleted] = useState(false)
    const [redirecting, setRedirecting] = useState(false)

    const needMoreNotes = Math.max(0, CREATIVE_MIN_NOTES - notesPlayed)

    useEffect(() => {
        if (!completedPopupOpen) return
        const timeout = window.setTimeout(() => {
            setRedirecting(true)
            router.push('/child/games/mini-piano/mini-musician')
        }, 1800)
        return () => window.clearTimeout(timeout)
    }, [completedPopupOpen, router])

    const pressKey = useCallback(async (key: RainbowPianoKey) => {
        if (completedPopupOpen) return
        setActiveKeyId(key.id)
        setMessage(`Nốt ${key.speakLabel}`)
        await playFrequency(key.freq, 0.44, 0.24)
        setNotesPlayed((prev) => {
            const next = prev + 1
            if (!hasCompleted && next >= CREATIVE_MIN_NOTES) {
                setHasCompleted(true)
                setCompletedPopupOpen(true)
                setMessage('Tuyệt vời! Bé đã hoàn thành học đàn.')
            }
            return next
        })
        window.setTimeout(() => setActiveKeyId((current) => (current === key.id ? null : current)), 160)
    }, [completedPopupOpen, hasCompleted, playFrequency])

    return (
        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center text-center">
            <div className="mb-4 flex w-full justify-start sm:mb-8">
                <Link
                    href="/child/games/mini-piano"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 px-3 py-1.5 text-sm font-extrabold text-white shadow-[0_6px_0_#b45309] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:brightness-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                >
                    <ArrowLeft className="h-[18px] w-[18px] text-white" />
                    <span>Quay lại</span>
                </Link>
            </div>

            <div className="flex w-full flex-col items-center">
                <div className="w-full">
                    <div className="mb-4 text-center sm:mb-8">
                        <h2 className="mb-1 text-2xl font-bold text-orange-600 sm:mb-2 sm:text-3xl">Chế độ: Piano</h2>
                        <p className="text-xs font-bold text-slate-500 sm:text-sm">{message}</p>
                        <p className="mt-1 text-xs font-extrabold text-emerald-600">
                            Tiến độ: {Math.min(notesPlayed, CREATIVE_MIN_NOTES)}/{CREATIVE_MIN_NOTES} nốt
                        </p>
                    </div>

                    <PianoBoard
                        activeKeyId={activeKeyId}
                        pulseKeyId={null}
                        onPress={pressKey}
                    />
                </div>

                {!hasCompleted && needMoreNotes > 0 ? (
                    <div className="mt-8 rounded-full bg-gray-100 px-6 py-3 text-sm font-black text-gray-600 sm:mt-12">
                        Cần thêm {needMoreNotes} nốt để hoàn thành bài học
                    </div>
                ) : null}
            </div>

            {completedPopupOpen ? (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Chúc mừng</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-800">Bạn đã hoàn thành học đàn!</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-500">Đang chuyển tới trang 5 bài hát Nhạc Công Nhí...</p>
                        <button
                            type="button"
                            disabled={redirecting}
                            onClick={() => {
                                setRedirecting(true)
                                router.push('/child/games/mini-piano/mini-musician')
                            }}
                            className="mt-5 rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-70"
                        >
                            {redirecting ? 'Đang chuyển...' : 'Đi tới 5 bài hát'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}

function MiniMusicianHubView() {
    const router = useRouter()
    const [selectedSongSlug, setSelectedSongSlug] = useState<string>(MINI_MUSICIAN_SONGS[0]?.slug ?? '')

    return (
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 pt-2">
            <p className="text-center text-xs font-bold text-slate-500 sm:text-sm">
                Chọn bài hát bé thích, rồi bấm nút phát để vào bài.
            </p>

            {MINI_MUSICIAN_SONGS.map((song) => {
                const isSelected = selectedSongSlug === song.slug

                return (
                    <div key={song.slug} className="relative w-full">
                        <button
                            type="button"
                            onClick={() => setSelectedSongSlug(song.slug)}
                            className={cn(
                                'relative flex h-24 w-full cursor-pointer items-center rounded-[24px] border-2 bg-white px-4 pr-24 shadow-sm transition-all',
                                isSelected
                                    ? 'border-amber-300 shadow-[0_8px_20px_rgba(251,146,60,0.28)]'
                                    : 'border-slate-100 hover:shadow-md'
                            )}
                        >
                            <div className="flex flex-1 items-center gap-4">
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                                    isSelected ? 'bg-orange-500' : 'bg-green-500'
                                )}>
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h3 className={cn('text-lg font-bold', isSelected ? 'text-orange-700' : 'text-slate-700')}>
                                        {song.title}
                                    </h3>
                                    {isSelected ? <p className="text-xs font-bold text-orange-500">Đang chọn</p> : null}
                                </div>
                            </div>
                        </button>

                        {isSelected ? (
                            <button
                                type="button"
                                aria-label={`Vào bài ${song.title}`}
                                onClick={() => router.push(`/child/games/mini-piano/mini-musician/lesson/${song.slug}`)}
                                className="absolute right-3 top-1/2 flex h-12 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 px-4 text-white shadow-[0_5px_0_#c2410c] transition-all hover:-translate-y-[55%] hover:bg-orange-600 active:translate-y-[calc(-50%+2px)]"
                            >
                                <PlayCircle className="h-6 w-6" />
                            </button>
                        ) : null}
                    </div>
                )
            })}
        </section>
    )
}

function EarTrainingView() {
    const { playFrequency, playError } = usePianoAudio()
    const [targetKeyId, setTargetKeyId] = useState(() => RAINBOW_PIANO_KEYS[Math.floor(Math.random() * RAINBOW_PIANO_KEYS.length)].id)
    const [activeKeyId, setActiveKeyId] = useState<string | null>(null)
    const [message, setMessage] = useState('Nghe nốt nhạc rồi chọn đúng phím nhé!')
    const [score, setScore] = useState(0)

    const targetKey = useMemo(() => RAINBOW_PIANO_KEYS.find((key) => key.id === targetKeyId) ?? RAINBOW_PIANO_KEYS[0], [targetKeyId])

    const nextRound = useCallback(() => {
        const next = RAINBOW_PIANO_KEYS[Math.floor(Math.random() * RAINBOW_PIANO_KEYS.length)]
        setTargetKeyId(next.id)
    }, [])

    const playTarget = useCallback(async () => {
        await playFrequency(targetKey.freq, 0.5, 0.24)
    }, [playFrequency, targetKey.freq])

    const onPress = useCallback(async (key: RainbowPianoKey) => {
        setActiveKeyId(key.id)
        await playFrequency(key.freq, 0.44, 0.25)

        if (key.id === targetKeyId) {
            setScore((prev) => prev + 1)
            setMessage('Đúng rồi! Bé nghe rất tốt!')
            window.setTimeout(() => {
                setActiveKeyId(null)
                nextRound()
            }, 300)
            return
        }

        await playError()
        setMessage('Sai rồi. Mình nghe lại và thử lại nhé!')
        window.setTimeout(() => setActiveKeyId(null), 300)
    }, [nextRound, playError, playFrequency, targetKeyId])

    return (
        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center text-center">
            <div className="mb-4 flex w-full justify-start sm:mb-8">
                <Link
                    href="/child/games/mini-piano"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 px-3 py-1.5 text-sm font-extrabold text-white shadow-[0_6px_0_#b45309] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:brightness-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                >
                    <ArrowLeft className="h-[18px] w-[18px] text-white" />
                    <span>Quay lại</span>
                </Link>
            </div>

            <div className="w-full rounded-2xl border border-white bg-white/65 p-4 shadow-lg backdrop-blur-sm sm:p-6">
                <h2 className="text-2xl font-black text-purple-700 sm:text-3xl">Đôi Tai Tinh Anh</h2>
                <p className="mt-1 text-sm font-bold text-slate-600">Điểm: {score}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">{message}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">Cách chơi: bấm “Nghe nốt cần tìm”, sau đó chọn đúng phím vừa nghe.</p>
                <button
                    type="button"
                    onClick={playTarget}
                    className="mt-3 rounded-full bg-purple-600 px-5 py-2 text-sm font-black text-white hover:bg-purple-700"
                >
                    Nghe nốt cần tìm
                </button>
            </div>

            <div className="mt-5 w-full">
                <PianoBoard
                    activeKeyId={activeKeyId}
                    pulseKeyId={null}
                    onPress={onPress}
                />
            </div>
        </section>
    )
}

export default function MiniPianoModePage() {
    const params = useParams<{ mode: string }>()
    const mode = params?.mode

    const currentMode = useMemo<PianoMode | null>(() => {
        if (mode === 'creative-sounds') return 'creative-sounds'
        if (mode === 'mini-musician') return 'mini-musician'
        if (mode === 'ear-training') return 'ear-training'
        return null
    }, [mode])

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-6">
            <Image
                src="https://assets.cuthongminh.com/assets/bg.webp"
                alt="Background"
                fill
                sizes="100vw"
                className="object-cover z-0"
            />
            <main className="relative z-10 mx-auto w-full max-w-6xl space-y-5">
                {currentMode === 'creative-sounds' ? <CreativeSoundsView /> : null}

                {currentMode === 'mini-musician' ? (
                    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
                        <div className="mb-6 flex w-full items-center justify-between sm:mb-10">
                            <Link
                                href="/child/games/mini-piano"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 px-4 py-2 font-extrabold text-white shadow-[0_6px_0_#b45309] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:brightness-95"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="hidden text-sm font-bold sm:block">Quay lại</span>
                            </Link>
                            <span className="text-center text-2xl font-bold text-orange-500 drop-shadow-sm md:text-6xl">Nhạc Công Nhí</span>
                            <div className="w-16" />
                        </div>
                        <MiniMusicianHubView />
                    </section>
                ) : null}

                {currentMode === 'ear-training' ? <EarTrainingView /> : null}

                {currentMode === null ? (
                    <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
                        <p className="text-base font-black text-slate-700">Chế độ chưa khả dụng.</p>
                        <p className="mt-1 text-sm text-slate-500">Bạn quay lại trang Piano để chọn chế độ hợp lệ nhé.</p>
                    </section>
                ) : null}
            </main>
        </div>
    )
}
